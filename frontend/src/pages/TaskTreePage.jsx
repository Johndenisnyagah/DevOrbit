/**
 * Task Tree page.
 *
 * Renders the full task list as a hierarchy. Three grouping modes are
 * available via a segmented switcher at the top:
 *
 *   - Status  (default): groups by ToDo / InProgress / Paused / Done
 *   - Priority:           groups by High / Medium / Low
 *   - Flat:               one big list, sorted by recency
 *
 * Each group is collapsible. Clicking a row opens the task detail.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'
import { PageEyebrow } from '../components/Atoms'
import { STATUS_META, fmtDate, statusLabel } from '../helpers'

const GROUPING = [
  { key: 'status',   label: 'By Status' },
  { key: 'priority', label: 'By Priority' },
  { key: 'flat',     label: 'Flat' },
]

// Order tasks land in within each group: most-recently-updated first.
const sortByRecency = (a, b) =>
  (b.updated_at || '').localeCompare(a.updated_at || '')

export default function TaskTreePage({ onToast }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [grouping, setGrouping] = useState('status')
  // Groups default to open. `closed` tracks the *deviations* so switching
  // grouping modes lands in the most useful state without remembering
  // per-mode collapse state.
  const [closed, setClosed] = useState({ Done: true, Low: true })

  useEffect(() => {
    let cancelled = false
    api.getTasks()
      .then(d => { if (!cancelled) setTasks(d.tasks) })
      .catch(e => onToast?.(e.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [onToast])

  const groups = useMemo(() => {
    if (grouping === 'status') {
      const order = ['InProgress', 'Paused', 'ToDo', 'Done']
      return order.map(key => {
        const meta = STATUS_META.find(s => s.key === key)
        const items = tasks.filter(t => t.status === key).sort(sortByRecency)
        return { key, label: meta?.label ?? key, pipClass: `s-${key}`, items }
      })
    }
    if (grouping === 'priority') {
      const order = ['High', 'Medium', 'Low']
      return order.map(key => {
        const items = tasks.filter(t => t.priority === key).sort(sortByRecency)
        return { key, label: key, pipClass: `p-${key}-pip`, items }
      })
    }
    // Flat: one synthetic group so the same render path works for both.
    return [{
      key: 'all',
      label: 'All Tasks',
      pipClass: 's-InProgress',
      items: [...tasks].sort(sortByRecency),
    }]
  }, [tasks, grouping])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <>
      <PageEyebrow kicker="Workflow Hierarchy" title="Task Tree" />

      <div className="tree__switch" role="tablist" aria-label="Grouping">
        {GROUPING.map(g => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={g.key === grouping}
            className={`tree__switch-btn${g.key === grouping ? ' tree__switch-btn--active' : ''}`}
            onClick={() => setGrouping(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="tree">
        {groups.map(g => {
          const isOpen = !closed[g.key]
          return (
            <div key={g.key} className="tree__group">
              <button
                type="button"
                className="tree__group-head"
                onClick={() => setClosed(c => ({ ...c, [g.key]: isOpen }))}
                aria-expanded={isOpen}
              >
                <span
                  className={`tree__group-chev${isOpen ? ' tree__group-chev--open' : ''}`}
                >
                  <Icon name="chev" size={13} />
                </span>
                <span className={`tree__group-pip ${g.pipClass}`} />
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
