/**
 * Task detail page.
 *
 * Shows the active task, server-approved next actions, the latest context
 * snapshot, interruption logging, and the complete activity feed.
 */
import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'

const STATUS_LABEL = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Paused: 'Paused',
  Done: 'Done',
}

/**
 * Render a single task with workflow controls and history.
 *
 * @param {object} props
 * @param {(message: string, type?: string) => void} props.onToast Toast dispatcher.
 */
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

  // Load the task from the route ID and return to the dashboard if it no longer
  // exists or cannot be fetched.
  useEffect(() => {
    let cancelled = false
    api.getTask(id)
      .then(next => {
        if (!cancelled) setData(next)
      })
      .catch(() => navigate('/'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, navigate])

  /** Execute a server-validated status transition. */
  const handleStatus = async (status) => {
    try {
      const res = await api.updateStatus(id, status)
      onToast?.(`Status updated to ${STATUS_LABEL[status] ?? status}`)
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

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!data) return null

  const { task, logs, snapshot, valid_next } = data

  /** Render the correct action button for each server-provided next status. */
  const actionBtn = (status) => {
    const isResume = status === 'InProgress' && task.status !== 'ToDo'
    const map = {
      InProgress: (
        <button key={status} type="button" className="btn-start" onClick={() => handleStatus(status)}>
          <Icon name={isResume ? 'rotate' : 'play'} size={15} />
          {isResume ? 'Resume Task' : 'Start Task'}
        </button>
      ),
      Paused: (
        <button key={status} type="button" className="btn-pause" onClick={() => handleStatus(status)}>
          <Icon name="pause" size={15} />
          Pause Task
        </button>
      ),
      Done: (
        <button key={status} type="button" className="btn-done" onClick={() => handleStatus(status)}>
          <Icon name="check" size={15} />
          Mark Done
        </button>
      ),
    }
    return map[status] ?? null
  }

  return (
    <>
      <div className="main-scroll">
        <div className="detail-layout">
          <div>
            <div className="detail-card hero-detail-card">
              <div className="detail-meta">
                <span className={`badge p-${task.priority}`}>{task.priority}</span>
                <span className={`badge s-${task.status}`}>{STATUS_LABEL[task.status] ?? task.status}</span>
                <span className="detail-updated">{task.updated_at?.slice(0, 16)}</span>
              </div>
              <h1 className="detail-title">{task.title}</h1>
              {task.description && <p className="detail-desc">{task.description}</p>}

              {valid_next.length > 0 && (
                <div className="action-panel">
                  <div className="panel-label">Actions</div>
                  <div className="action-btns">
                    {valid_next.map(actionBtn)}
                  </div>
                </div>
              )}
            </div>

            {(snapshot || task.status !== 'Done') && (
              <div className="detail-card">
                <div className="detail-card-title">
                  <Icon name="pin" size={15} />
                  Context Snapshot
                </div>
                {snapshot ? (
                  <>
                    <div className="snapshot-text">{snapshot.content}</div>
                    <div className="micro-date">{snapshot.created_at?.slice(0, 16)}</div>
                    <Link to={`/tasks/${task.id}/snapshot`} className="btn-ghost btn-sm">Update Snapshot</Link>
                  </>
                ) : (
                  <>
                    <p className="muted-copy">No context snapshot has been captured yet.</p>
                    <Link to={`/tasks/${task.id}/snapshot`} className="btn-ghost btn-sm">Save Snapshot</Link>
                  </>
                )}
              </div>
            )}

            {task.status === 'InProgress' && (
              <div className="detail-card interrupt-card">
                <div className="detail-card-title">
                  <Icon name="alert" size={15} />
                  Log an Interruption
                </div>
                <form onSubmit={handleInterrupt}>
                  <div className="interrupt-row">
                    <input
                      className="form-input interrupt-input"
                      placeholder="What pulled you away?"
                      value={interrupt}
                      onChange={e => setInterrupt(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-interrupt" disabled={submitting}>
                      {submitting ? 'Logging' : 'Log'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="detail-card activity-card">
            <div className="detail-card-title">Activity Log</div>
            {logs.length > 0 ? (
              <div className="activity-feed">
                {logs.map(log => (
                  <div key={log.id} className={`activity-entry ev-${log.event_type}`}>
                    <div className="activity-pip" />
                    <div className="activity-body">
                      <div className="activity-kind">{log.event_type}</div>
                      <div className="activity-text">{log.content}</div>
                      <span className="activity-when">{log.timestamp?.slice(0, 16)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
