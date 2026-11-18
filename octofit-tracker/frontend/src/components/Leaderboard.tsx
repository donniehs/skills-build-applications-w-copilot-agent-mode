import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiData<LeaderboardResponse>('/api/leaderboard');
  const entries = data?.leaderboard ?? [];

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={data !== undefined && entries.length === 0}
      emptyMessage="No leaderboard rankings yet."
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li className="list-group-item" key={entry.teamName}>
            {entry.teamName}: {entry.totalPoints} points (rank {entry.rank})
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
