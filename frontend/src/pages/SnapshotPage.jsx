/**
 * Context snapshot page.
 *
 * Centered form with a hot-tinted pin icon, an eyebrow + title pair, the
 * task title, a tall textarea, and a primary/ghost action row. Submitting
 * writes a Snapshot row keyed to the task and appends a Snapshot event to
 * the activity log on the backend.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'

export default function SnapshotPage({ onToast }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.getTask(id)
      .then(d => { if (!cancelled) setTask(d.task) })
      .catch(() => navigate('/'))
    return () => { cancelled = true }
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.saveSnapshot(id, content.trim())
      onToast?.('Context snapshot saved.')
      navigate(`/tasks/${id}`)
    } catch (e) {
      onToast?.(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form form--snapshot panel" style={{ marginTop: 20 }}>
      <div className="form__icon"><Icon name="pin" size={18} /></div>
      <div className="form__eyebrow">Resume Context</div>
      <div className="form__title">Save a context snapshot</div>
      {task && (
        <p className="form__sub">
          For <strong>{task.title}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label" htmlFor="snap-content">Where did you leave off?</label>
          <textarea
            id="snap-content"
            className="field field--area field--tall"
            placeholder="Working state, blockers, the next command, or the next file to inspect."
            value={content}
            onChange={e => setContent(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={loading}>
            <Icon name="pin" size={13} />
            {loading ? 'Saving' : 'Save Snapshot'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate(`/tasks/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
