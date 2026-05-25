/**
 * Task detail page.
 *
 * Two-column layout: a stacked main column (header, snapshot, interruption
 * logger) and a sidebar Activity Log fed by the backend. Status transitions
 * dispatch through the server-validated state machine.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'
import { fmtFull, statusLabel } from '../helpers'

/**
 * Snapshot panel with an expandable history disclosure.
 *
 * Shows the latest snapshot inline (matching the original behaviour). A
 * "History (N)" button lazily fetches every snapshot for the task and
 * renders them in reverse-chronological order beneath the latest entry.
 */
function SnapshotPanel({ taskId, latest }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    const next = !open
    setOpen(next)
    if (next && history === null && !loading) {
      setLoading(true)
      try {
        const d = await api.getSnapshots(taskId)
        setHistory(d.snapshots ?? [])
      } catch {
        setHistory([])
      } finally {
        setLoading(false)
      }
    }
  }

  // The latest entry is rendered separately above the history list, so
  // strip it from the rendered older entries to avoid duplication.
  const older = history?.slice(latest ? 1 : 0) ?? []
  const olderCount = Math.max(0, (history?.length ?? 0) - (latest ? 1 : 0))

  return (
    <div className="panel">
      <div className="panel__head">
        <span
          className="panel__label"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Icon name="pin" size={13} /> Context Snapshot
        </span>
        {latest && (
          <span className="detail__updated">{fmtFull(latest.created_at)}</span>
        )}
      </div>

      {latest ? (
        <>
          <div className="snap">{latest.content}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Link
              to={`/tasks/${taskId}/snapshot`}
              className="btn btn--ghost"
              style={{ height: 32, padding: '0 12px', fontSize: 11 }}
            >
              Update Snapshot
            </Link>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ height: 32, padding: '0 12px', fontSize: 11 }}
              onClick={handleToggle}
            >
              <Icon
                name="chev"
                size={11}
                style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}
              />
              {open ? 'Hide history' : 'View history'}
            </button>
          </div>

          {open && (
            <div className="snap-history">
              {loading && (
                <div className="snap-history__empty">Loading history…</div>
              )}
              {!loading && olderCount === 0 && (
                <div className="snap-history__empty">No earlier snapshots.</div>
              )}
              {!loading && older.map(s => (
                <div key={s.id} className="snap-history__entry">
                  <div className="snap-history__date">{fmtFull(s.created_at)}</div>
                  <div className="snap-history__content">{s.content}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p style={{ color: 'var(--t3)', lineHeight: 1.6 }}>
            No context snapshot has been captured yet.
          </p>
          <Link
            to={`/tasks/${taskId}/snapshot`}
            className="btn btn--ghost"
            style={{ marginTop: 14, height: 32, padding: '0 12px', fontSize: 11 }}
          >
            Save Snapshot
          </Link>
        </>
      )}
    </div>
  )
}

export default function TaskDetailPage({ onToast }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interrupt, setInterrupt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /** Reload the detail payload after a mutation without leaving the page. */
  const refresh = async () => {
    const next = await api.getTask(id)
    setData(next)
  }

  useEffect(() => {
    let cancelled = false
    api.getTask(id)
      .then(next => { if (!cancelled) setData(next) })
      .catch(() => navigate('/'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, navigate])

  /** Execute a server-validated status transition. */
  const handleStatus = async (status) => {
    try {
      const res = await api.updateStatus(id, status)
      onToast?.(`Status updated to ${statusLabel(status)}`)
      if (res.redirect_snapshot) {
        navigate(`/tasks/${id}/snapshot`)
      } else {
        await refresh()
      }
    } catch (e) {
      onToast?.(e.message, 'error')
    }
  }

  /** Persist an interruption note and refresh the activity feed. */
  const handleInterrupt = async (e) => {
    e.preventDefault()
    if (!interrupt.trim()) return
    setSubmitting(true)
    try {
      await api.logInterrupt(id, interrupt.trim())
      setInterrupt('')
      onToast?.('Interruption logged')
      await refresh()
    } catch (e) {
      onToast?.(e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!data) return null

  const { task, logs, snapshot, valid_next } = data
  // Activity Log shows newest first; the backend returns DESC already.

  /** Render the correct action button for each server-provided next status. */
  const actionBtn = (status) => {
    if (status === 'InProgress') {
      const isResume = task.status === 'Paused'
      return (
        <button key={status} type="button" className="btn btn--start" onClick={() => handleStatus(status)}>
          <Icon name={isResume ? 'rotate' : 'play'} size={13} />
          {isResume ? 'Resume' : 'Start'}
        </button>
      )
    }
    if (status === 'Paused') {
      return (
        <button key={status} type="button" className="btn btn--pause" onClick={() => handleStatus(status)}>
          <Icon name="pause" size={13} /> Pause
        </button>
      )
    }
    if (status === 'Done') {
      return (
        <button key={status} type="button" className="btn btn--done" onClick={() => handleStatus(status)}>
          <Icon name="check" size={13} /> Mark Done
        </button>
      )
    }
    return null
  }

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow">Task #{String(task.id).padStart(3, '0')} · Detail</div>
      </div>

      <div className="detail">
        <div className="detail__main">
          <div className="panel">
            <div className="detail__meta">
              <span className={`badge p-${task.priority}`}>{task.priority}</span>
              <span className={`badge s-${task.status}`}>{statusLabel(task.status)}</span>
              <span className="detail__updated">UPDATED · {fmtFull(task.updated_at)}</span>
            </div>
            <h1 className="detail__title">{task.title}</h1>
            {task.description && <p className="detail__desc">{task.description}</p>}

            {valid_next?.length > 0 && (
              <div className="detail__actions">
                <div className="panel__label">Actions</div>
                <div className="detail__actions-row">
                  {valid_next.map(actionBtn)}
                </div>
              </div>
            )}
          </div>

          <SnapshotPanel taskId={task.id} latest={snapshot} />


          {task.status === 'InProgress' && (
            <div className="panel">
              <div className="panel__head">
                <span
                  className="panel__label"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Icon name="alert" size={13} /> Log an Interruption
                </span>
              </div>
              <form className="interrupt-row" onSubmit={handleInterrupt}>
                <input
                  className="field"
                  placeholder="What pulled you away?"
                  value={interrupt}
                  onChange={e => setInterrupt(e.target.value)}
                />
                <button type="submit" className="btn btn--alert" disabled={submitting}>
                  {submitting ? 'Logging' : 'Log'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel__head">
            <span className="panel__label">Activity Log</span>
            <span className="sect__count">{logs.length}</span>
          </div>
          <div className="feed">
            {logs.length === 0 && (
              <p style={{ color: 'var(--t3)' }}>No activity yet.</p>
            )}
            {logs.map(log => (
              <div key={log.id} className={`feed__entry ev-${log.event_type}`}>
                <span className="feed__pip" />
                <div>
                  <div className="feed__kind">{log.event_type}</div>
                  <div className="feed__text">{log.content}</div>
                  <span className="feed__when">{fmtFull(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
