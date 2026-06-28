import { BaseCard, CardContent, Button, Badge } from '../../../components/ui';
import { Bookmark, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { type PlacementJob } from '../../../shared/types/product';

interface JobCardProps {
  job: PlacementJob;
  onClick?: () => void;
  onApply?: () => void;
  onBookmark?: () => void;
}

export function JobCard({ job, onClick, onApply, onBookmark }: JobCardProps) {
  const initial = job.company?.[0]?.toUpperCase() || "?";
  const comp = job.ctc || job.stipend || "Unlisted";

  const eligBadge = job.eligibility_status === "eligible" ? "success" 
                  : job.eligibility_status === "almost_eligible" ? "warning"
                  : "danger";

  const eligText = job.eligibility_status === "eligible" ? "Eligible"
                 : job.eligibility_status === "almost_eligible" ? "Almost Eligible"
                 : "Not Eligible";

  return (
    <BaseCard hoverable onClick={onClick}>
      <CardContent style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Header Row: Avatar, Title/Company, Bookmark */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', background: 'var(--primary-softest)', color: 'var(--primary)', border: '1px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
                {initial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.2 }}>{job.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 500 }}>{job.company}</span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {job.location}</span>
                </div>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onBookmark?.(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem', marginTop: '-0.25rem', marginRight: '-0.25rem' }}>
              <Bookmark size={20} />
            </button>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Badge variant="default" icon={<Briefcase size={12} style={{ opacity: 0.7 }} />}>{job.type}</Badge>
            <Badge variant="default" icon={<DollarSign size={12} style={{ opacity: 0.7 }} />}>{comp}</Badge>
          </div>
        </div>

        {/* Footer Area */}
        <div style={{ padding: '1rem 1.25rem', background: 'var(--surface-soft)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 var(--radius) var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge variant={eligBadge}>{eligText}</Badge>
            {job.deadline_days_left !== null && (
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                {job.deadline_days_left === 0 ? "Ends today" : `${job.deadline_days_left}d left`}
              </span>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onApply?.(); }}>Apply</Button>
        </div>
      </CardContent>
    </BaseCard>
  );
}
