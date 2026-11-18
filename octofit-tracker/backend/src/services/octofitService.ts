import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type RequestRecord = Record<string, unknown>;

function isRequestRecord(input: unknown): input is RequestRecord {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRequestRecord(input)) throw httpError(400, 'Activity must be an object');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw httpError(400, 'Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || !['run', 'cycle', 'walk', 'strength'].includes(type)) {
    throw httpError(400, 'A valid activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRequestRecord(input)) throw httpError(400, 'Team must be an object');
  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw httpError(400, 'Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw httpError(400, 'Team mascot is required');
  }
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw httpError(400, 'Members must be an array of valid user IDs');
  }

  const uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length > 0) {
    const existingUsers = await User.countDocuments({ _id: { $in: uniqueMembers } });
    if (existingUsers !== uniqueMembers.length) throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(5)
    .lean();
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'mobility',
    strength: 'strength',
  };
  const recentFocus = recentActivities.map(({ type }) => activityFocus[type]).find(Boolean);
  const preferredFocus = user.fitnessGoal || recentFocus;
  const workouts = await Workout.find().lean();

  return workouts
    .map((workout) => {
      const matchesGoal = workout.focus === preferredFocus;
      const matchesActivity = workout.focus === recentFocus;
      return {
        ...workout,
        reason: matchesGoal
          ? `Matches your ${user.fitnessGoal} fitness goal.`
          : matchesActivity
            ? `Builds on your recent ${recentActivities[0]?.type} activity.`
            : 'Suggested to support your fitness routine.',
        priority: matchesGoal ? 2 : matchesActivity ? 1 : 0,
      };
    })
    .sort((left, right) => right.priority - left.priority || left.title.localeCompare(right.title))
    .map(({ priority: _priority, ...workout }) => workout);
}

export { User };
