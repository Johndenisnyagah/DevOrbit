/**
 * Task creation page.
 *
 * A centered form panel: title input, description textarea, segmented
 * priority picker, and a primary/ghost action row.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'
import { PageEyebrow } from '../components/Atoms'
import { PRIORITY_META } from '../helpers'

export default function TaskCreatePage({ onToast }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const task = await api.createTask(form)
      onToast?.(`Task "${task.title}" created.`)
      navigate(`/tasks/${task.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageEyebrow kicker="Task Intake" title="Create a new task" />

      <div className="form panel">
        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label className="form__label" htmlFor="ct-title">Title</label>
            <input
              id="ct-title"
              className="field"
              placeholder="e.g. Fix auth refresh flow"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
            {error && <div className="form__error">{error}</div>}
          </div>

          <div className="form__group">
            <label className="form__label" htmlFor="ct-desc">Description</label>
            <textarea
              id="ct-desc"
              className="field field--area"
              placeholder="Relevant context, affected files, or next checks."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="form__group">
            <span className="form__label">Priority</span>
            <div className="priority-pick">
              {PRIORITY_META.map(p => (
                <button
                  key={p.key}
                  type="button"
                  className={`pick${p.key === form.priority ? ' active' : ''}`}
                  onClick={() => set('priority', p.key)}
                >
                  <span className={`dot p-${p.key}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={loading}>
              <Icon name="plus" size={13} />
              {loading ? 'Creating' : 'Create Task'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
