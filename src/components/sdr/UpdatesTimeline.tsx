import { Phone, Mail, Users, FileText, ClipboardList, HelpCircle, Clock, Calendar } from 'lucide-react';

interface Update {
  _id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'REPORT' | 'OTHER';
  title: string;
  description: string;
  date: string;
  sdrId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  attachments?: string[];
}

interface UpdatesTimelineProps {
  updates: Update[];
}

export default function UpdatesTimeline({ updates }: UpdatesTimelineProps) {
  const typeConfigs: Record<Update['type'], { color: string, icon: any }> = {
    CALL: { color: '#3b82f6', icon: Phone },
    EMAIL: { color: '#10b981', icon: Mail },
    MEETING: { color: '#f59e0b', icon: Users },
    NOTE: { color: 'var(--golden-opal)', icon: ClipboardList },
    REPORT: { color: '#8b5cf6', icon: FileText },
    OTHER: { color: 'var(--muted-jade)', icon: HelpCircle },
  };

  if (updates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem', border: '1px dashed rgba(0,0,0,0.1)' }}>
        <p style={{ color: 'var(--muted-jade)', fontSize: '0.9375rem' }}>No updates yet. Log your first activity above.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Vertical Line */}
      <div style={{ 
        position: 'absolute', 
        left: '0.4375rem', 
        top: '0.5rem', 
        bottom: '0.5rem', 
        width: '2px', 
        background: 'linear-gradient(to bottom, rgba(196, 183, 91, 0.3) 0%, rgba(196, 183, 91, 0.05) 100%)',
        borderRadius: '1rem'
      }} />

      {updates.map((update) => {
        const config = typeConfigs[update.type];
        const Icon = config.icon;

        return (
          <div key={update._id} style={{ position: 'relative' }}>
            {/* Timeline Dot */}
            <div style={{ 
              position: 'absolute', 
              left: '-1.4375rem', 
              top: '0.25rem', 
              width: '1rem', 
              height: '1rem', 
              borderRadius: '50%', 
              background: 'white', 
              border: `2px solid ${config.color}`,
              zIndex: 1,
              boxShadow: '0 0 0 4px white'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    padding: '0.375rem', 
                    borderRadius: '0.5rem', 
                    background: `${config.color}15`, 
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={14} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--imperial-emerald)', margin: 0 }}>
                    {update.title}
                  </h4>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    color: config.color, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    background: `${config.color}10`,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}>
                    {update.type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted-jade)', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {new Date(update.date).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div style={{ 
                background: 'white', 
                padding: '1rem 1.25rem', 
                borderRadius: '0.75rem', 
                border: '1px solid rgba(0,0,0,0.05)', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)', 
                color: 'var(--imperial-emerald)', 
                fontSize: '0.875rem', 
                lineHeight: '1.6', 
                marginLeft: '0.25rem' 
              }}>
                {update.description}
                <div style={{ 
                  marginTop: '0.75rem', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px solid rgba(0,0,0,0.03)', 
                  fontSize: '0.7rem', 
                  color: 'var(--muted-jade)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  fontWeight: '600'
                }}>
                  Logged by {update.sdrId.name}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
