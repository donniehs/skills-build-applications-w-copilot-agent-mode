import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

const userEmail = 'mona@example.com';

export default function Workouts() {
  const { data, loading, error } = useApiData<WorkoutResponse>(
    `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`,
  );
  const suggestions = data?.suggestions ?? [];

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={data !== undefined && suggestions.length === 0}
      emptyMessage="No workout suggestions available."
    >
      <ul className="list-group">
        {suggestions.map((workout) => (
          <li className="list-group-item" key={workout.title}>
            <strong>{workout.title}</strong> - {workout.focus}, {workout.minutes} minutes, {workout.difficulty}.
            <p className="mb-0">{workout.reason}</p>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
