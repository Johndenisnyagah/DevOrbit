/**
 * Task creation page.
 *
 * Collects the minimum information needed for a task and relies on the backend
 * to create the record with the default `ToDo` status and initial activity log.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'

const PRIORITIES = ['High', 'Medium', 'Low']

/**
 * Render the new-task form.
 *
 * @param {object} props
 * @param {(message: string, type?: string) => void} props.onToast Toast dispatcher.
 */
export default function TaskCreatePage({ onToast }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /** Update one field in the controlled task form. */
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /** Validate the form, create the task, and return to the dashboard. */
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
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="main-topbar">
        <div className="topbar-breadcrumb">
          <Link to="/">Dashboard</Link>
          <span className="crumb-muted">New Task</span>
        </div>
      </div>

      <div className="main-scroll">
        <div className="form-card">
          <div className="form-eyebrow">Task Intake</div>
          <div className="form-title">Create a New Task</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title</label>
              <input
                id="task-title"
                className="form-input"
                placeholder="Fix auth refresh flow"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                autoFocus
              />
              {error && <div className="form-error">{error}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                className="form-textarea"
                placeholder="Relevant context, affected files, or next checks."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <span className="form-label">Priority</span>
              <div className="priority-picker">
                {PRIORITIES.map(priority => (
                  <button
                    key={priority}
                    type="button"
                    className={`priority-choice p-${priority}${form.priority === priority ? ' active' : ''}`}
                    onClick={() => set('priority', priority)}
                  >
                    <span className={`priority-dot p-${priority}`} />
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                <Icon name="plus" size={15} />
                {loading ? 'Creating' : 'Create Task'}
              </button>
              <Link to="/" className="btn-ghost">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
