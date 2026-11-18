import { CapabilityCard } from './CapabilityCard.js';
import { useApiData } from '../api/useApiData.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiData<ActivityResponse>('/api/activities');
  const activities = data?.activities ?? [];

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={data !== undefined && activities.length === 0}
      emptyMessage="No activities yet."
    >
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={`${activity.type}-${index}`}>
            {activity.type} - {activity.minutes} minutes ({activity.points} points)
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
