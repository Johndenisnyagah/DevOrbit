/**
 * Task Tree page.
 *
 * Renders the full task list as a hierarchy grouped by status, with each
 * group collapsible. Tasks within a group show priority, title, status
 * badge, and last update.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'
import { PageEyebrow } from '../components/Atoms'
import { STATUS_META, fmtDate, statusLabel } from '../helpers'

export default function TaskTreePage({ onToast }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({
    InProgress: true,
    Paused: true,
    ToDo: true,
    Done: false,
  })

  useEffect(() => {
    let cancelled = false
    api.getTasks()
      .then(d => { if (!cancelled) setTasks(d.tasks) })
      .catch(e => onToast?.(e.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [onToast])

  const groups = useMemo(() => {
    // Render order: InProgress on top so today's focus reads first.
    const order = ['InProgress', 'Paused', 'ToDo', 'Done']
    return order.map(key => {
      const meta = STATUS_META.find(s => s.key === key)
      const items = tasks
        .filter(t => t.status === key)
        .slice()
        .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
      return { key, label: meta?.label ?? key, items }
    })
  }, [tasks])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <>
      <PageEyebrow kicker="Workflow Hierarchy" title="Task Tree" />

      <div className="tree">
        {groups.map(g => {
          const isOpen = open[g.key]
          return (
            <div key={g.key} className="tree__group">
              <button
                type="button"
                className="tree__group-head"
                onClick={() => setOpen(o => ({ ...o, [g.key]: !o[g.key] }))}
                aria-expanded={isOpen}
              >
                <span
                  className={`tree__group-chev${isOpen ? ' tree__group-chev--open' : ''}`}
                >
                  <Icon name="chev" size={13} />
                </span>
                <span className={`tree__group-pip s-${g.key}`} />
                <span className="tree__group-label">{g.label}</span>
                <span className="tree__group-count">{g.items.length}</span>
              </button>

              {isOpen && (
                g.items.length === 0 ? (
                  <div className="tree__empty">No tasks in this group.</div>
                ) : (
                  <div className="tree__list">
                    {g.items.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className="tree__row"
                        onClick={() => navigate(`/tasks/${t.id}`)}
                      >
                        <span className="tree__row-rail" />
                        <span className={`dot p-${t.priority}`} />
                        <span className="tree__row-title">{t.title}</span>
                        <span className={`badge s-${t.status}`}>{statusLabel(t.status)}</span>
                        <span className="tree__row-meta">{fmtDate(t.updated_at)}</span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
