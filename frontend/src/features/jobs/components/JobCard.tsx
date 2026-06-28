import React from 'react';
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
      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
              {initial}
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>{job.title}</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>{job.company}</p>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onBookmark?.(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}>
            <Bookmark size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Badge variant="default" style={{ gap: '0.25rem' }}><Briefcase size={12} /> {job.type}</Badge>
          <Badge variant="default" style={{ gap: '0.25rem' }}><MapPin size={12} /> {job.location}</Badge>
          <Badge variant="default" style={{ gap: '0.25rem' }}><DollarSign size={12} /> {comp}</Badge>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant={eligBadge}>{eligText}</Badge>
            {job.deadline_days_left !== null && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{job.deadline_days_left}d left</span>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onApply?.(); }}>Apply</Button>
        </div>
      </CardContent>
    </BaseCard>
  );
}
