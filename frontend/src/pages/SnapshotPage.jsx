/**
 * Context snapshot page.
 *
 * Used after pausing a task or when manually updating the task's resume notes.
 * Snapshot content is intentionally free-form so developers can capture the
 * next command, file, failing test, blocker, or mental state.
 */
import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'

/**
 * Render the snapshot form for a specific task.
 *
 * @param {object} props
 * @param {(message: string, type?: string) => void} props.onToast Toast dispatcher.
 */
export default function SnapshotPage({ onToast }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState(null)

  // Load the task title for breadcrumb context and redirect if the task is gone.
  useEffect(() => {
    let cancelled = false
    api.getTask(id)
      .then(d => {
        if (!cancelled) setTask(d.task)
      })
      .catch(() => navigate('/'))
    return () => { cancelled = true }
  }, [id, navigate])

  /** Save the snapshot content, then return to the dashboard. */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.saveSnapshot(id, content.trim())
      onToast?.('Context snapshot saved.')
      navigate('/')
    } catch (e) {
      onToast?.(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="main-scroll">
        <div className="form-card snapshot-form-card">
          <div className="form-icon"><Icon name="pin" size={22} /></div>
          <div className="form-eyebrow">Resume Context</div>
          <div className="form-title">Save a Context Snapshot</div>
          {task && <p className="muted-copy">For <strong>{task.title}</strong></p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="snapshot-content">Where did you leave off?</label>
              <textarea
                id="snapshot-content"
                className="form-textarea tall"
                placeholder="Working state, blockers, next command, or next file to inspect."
                value={content}
                onChange={e => setContent(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                <Icon name="pin" size={15} />
                {loading ? 'Saving' : 'Save Snapshot'}
              </button>
              {task && <Link to={`/tasks/${id}`} className="btn-ghost">Cancel</Link>}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
