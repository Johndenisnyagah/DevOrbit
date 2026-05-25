/**
 * Security page.
 *
 * Three sections:
 *   - Audit summary stats (totals by event type).
 *   - Audit trail feed: chronological activity across all tasks, with task
 *     title links into the detail view.
 *   - Workspace sessions + connections: the current browser session, plus
 *     presentational cards for future workspace integrations.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'
import { PageEyebrow } from '../components/Atoms'
import { fmtFull } from '../helpers'

const WORKSPACES = [
  { key: 'github', name: 'GitHub',  sub: 'Repos and PRs' },
  { key: 'slack',  name: 'Slack',   sub: 'Mentions and DMs' },
  { key: 'linear', name: 'Linear',  sub: 'Issues and cycles' },
]

/** Friendly UA snippet (browser + OS) for the current-session card. */
function uaSummary() {
  if (typeof navigator === 'undefined') return 'Unknown client'
  const ua = navigator.userAgent
  let browser = 'Browser'
  if (/Edg\//.test(ua))          browser = 'Edge'
  else if (/Chrome\//.test(ua))  browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua))  browser = 'Safari'
  let os = 'Unknown OS'
  if (/Windows/.test(ua))         os = 'Windows'
  else if (/Macintosh|Mac OS/.test(ua)) os = 'macOS'
  else if (/Linux/.test(ua))      os = 'Linux'
  else if (/Android/.test(ua))    os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  return `${browser} · ${os}`
}

export default function SecurityPage({ onToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    api.getActivity(100)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => onToast?.(e.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [onToast])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const totals = data?.totals ?? { total: 0, status_changes: 0, snapshots: 0, interruptions: 0 }
  const logs = data?.logs ?? []
  const sessionStart = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  return (
    <>
      <PageEyebrow kicker="Audit Trail · Workspace Sessions" title="Security" />

      <div className="sec-stats">
        <div className="sec-stat">
          <span className="sec-stat__lbl">Total Events</span>
          <span className="sec-stat__num">{totals.total.toLocaleString()}</span>
          <span className="sec-stat__sub">All time</span>
        </div>
        <div className="sec-stat">
          <span className="sec-stat__lbl">Status Changes</span>
          <span className="sec-stat__num" style={{ color: 'var(--cyan)' }}>
            {totals.status_changes.toLocaleString()}
          </span>
          <span className="sec-stat__sub">Workflow transitions</span>
        </div>
        <div className="sec-stat">
          <span className="sec-stat__lbl">Snapshots</span>
          <span className="sec-stat__num" style={{ color: 'var(--amber)' }}>
            {totals.snapshots.toLocaleString()}
          </span>
          <span className="sec-stat__sub">Context captures</span>
        </div>
        <div className="sec-stat">
          <span className="sec-stat__lbl">Interruptions</span>
          <span className="sec-stat__num" style={{ color: 'var(--danger)' }}>
            {totals.interruptions.toLocaleString()}
          </span>
          <span className="sec-stat__sub">Recorded breaks</span>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 'var(--d-gap)' }}>
        <div className="panel__head">
          <span className="panel__label">Audit Trail</span>
          <span className="eyebrow" style={{ color: 'var(--t4)' }}>
            Most recent {logs.length}
          </span>
        </div>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--t3)' }}>No activity recorded yet.</p>
        ) : (
          <div className="audit">
            {logs.map(log => (
              <div key={log.id} className={`audit__entry ev-${log.event_type}`}>
                <span className="audit__pip" />
                <div>
                  <div className="audit__kind">{log.event_type}</div>
                  <div>
                    <span
                      className="audit__task"
                      onClick={() => navigate(`/tasks/${log.task_id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') navigate(`/tasks/${log.task_id}`) }}
                    >
                      {log.task_title}
                    </span>
                    <span className="audit__text">{log.content}</span>
                  </div>
                </div>
                <span className="audit__when">{fmtFull(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 'var(--d-gap)' }}>
        <div className="prefs__sect-head">
          <div className="panel__label">Active Session</div>
          <p className="prefs__sect-desc">
            DevOrbit currently runs locally; this is the browser session you're using right now.
          </p>
        </div>
        <div className="session-card">
          <div className="session-card__icon"><Icon name="shield" size={16} /></div>
          <div>
            <div className="session-card__lbl">{uaSummary()}</div>
            <div className="session-card__sub">Signed in · {sessionStart}</div>
          </div>
          <span className="session-card__tag">Current</span>
        </div>
      </div>

      <div className="panel">
        <div className="prefs__sect-head">
          <div className="panel__label">Connected Workspaces</div>
          <p className="prefs__sect-desc">
            Tools DevOrbit can integrate with. Connections are not active in the local build.
          </p>
        </div>
        <div className="workspaces">
          {WORKSPACES.map(w => (
            <div key={w.key} className="workspace">
              <div className="workspace__head">
                <div className="workspace__icon"><Icon name="orbit" size={14} /></div>
                <div>
                  <div className="workspace__name">{w.name}</div>
                  <div className="workspace__sub">{w.sub}</div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ height: 30, padding: '0 12px' }}
                onClick={() => onToast?.(`${w.name} integration is coming soon.`)}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
