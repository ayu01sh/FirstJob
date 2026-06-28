import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseCard, CardContent, Button, Badge } from '../../../components/ui';
import { Bookmark, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { type JobMatch } from '../../../shared/types/product';
import { api } from '../../../shared/api/client';

interface RecommendationCardProps {
  match: JobMatch;
  onClick?: () => void;
  onApply?: () => void;
}

export function RecommendationCard({ match, onClick, onApply }: RecommendationCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const initial = match.company?.[0]?.toUpperCase() || "?";

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) return;
    setSaving(true);
    try {
      await api.post("/api/v1/applications", {
        job_id: match.job_id,
        status: "saved",
        source: "matches_page"
      });
      setSaved(true);
    } catch (err: any) {
      alert("Failed to track: " + (err?.response?.data?.error?.details?.[0] || err.message));
    } finally {
      setSaving(false);
    }
  };

  const eBadgeClass = match.eligibility_status === "eligible" ? "success" 
                    : match.eligibility_status === "almost_eligible" ? "warning"
                    : "danger";

  const fitBadge = match.fit_level === 'strong' ? 'success' : match.fit_level === 'good' ? 'primary' : 'warning';

  return (
    <BaseCard hoverable onClick={onClick} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)' }} />
      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', height: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
              {initial}
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.2 }}>{match.title}</h4>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{match.company}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Badge variant="purple" style={{ gap: '0.25rem', color: 'var(--primary)', backgroundColor: 'var(--primary-softest)', padding: '0.35rem 0.75rem' }}>
              <Sparkles size={14} /> {Math.round(match.score * 100)}% Match
            </Badge>
            <button onClick={handleBookmark} disabled={saving} style={{ background: saved ? 'var(--primary-light)' : 'transparent', border: '1px solid ' + (saved ? 'var(--primary-light)' : 'var(--border)'), borderRadius: 'var(--radius-sm)', cursor: saving ? 'not-allowed' : 'pointer', color: saved ? 'var(--primary)' : 'var(--muted)', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {saved ? <Check size={18} /> : <Bookmark size={18} />}
            </button>
          </div>
        </div>

        {/* 2-Column Split: AI Insight & Skills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Why this match? */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <Sparkles size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>Why this match?</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {match.reasons.slice(0, 3).map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Skill Gaps or Matched Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {match.missing_skills.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <AlertTriangle size={14} color="var(--warning)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase' }}>Skill Gaps</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {match.missing_skills.slice(0, 4).map((s) => (
                    <Badge key={s} variant="default" style={{ background: '#fffaf0', borderColor: '#ffcc80', color: '#b9770e' }}>{s}</Badge>
                  ))}
                  {match.missing_skills.length > 4 && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>+{match.missing_skills.length - 4}</span>}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <Check size={14} color="var(--success)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>Matched Skills</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {match.matched_skills.slice(0, 4).map((s) => (
                    <Badge key={s} variant="default" style={{ background: '#e8f5e3', borderColor: '#c8e6c9', color: '#1b5e20' }}>{s}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {match.eligibility_status !== "eligible" && match.eligibility_reasons.length > 0 && (
          <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>{match.eligibility_reasons[0]} {match.eligibility_reasons.length > 1 && `(+${match.eligibility_reasons.length - 1} more)`}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant={eBadgeClass}>{match.eligibility_status === "eligible" ? "Eligible" : "Not Eligible"}</Badge>
            <Badge variant={fitBadge} style={{ textTransform: 'uppercase' }}>{match.fit_level}</Badge>
            {match.deadline_days_left !== null && (
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>{match.deadline_days_left}d left</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              <strong>Next:</strong> {match.next_action}
            </span>
            <Link to="/jobs">
              <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onApply?.(); }}>View Job</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </BaseCard>
  );
}
