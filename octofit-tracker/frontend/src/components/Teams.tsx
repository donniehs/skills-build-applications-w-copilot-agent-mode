import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Team = { name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiData<TeamResponse>('/api/teams');
  const teams = data?.teams ?? [];

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={data !== undefined && teams.length === 0}
      emptyMessage="No teams yet."
    >
      <ul className="list-group">
        {teams.map((team) => (
          <li className="list-group-item" key={team.name}>
            {team.name} ({team.mascot}) - {team.members.length} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
