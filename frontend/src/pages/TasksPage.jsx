/**
 * Dashboard page for task analytics and task navigation.
 *
 * This page combines backend task data with UI-only filters from the sidebar.
 * Backend sorting is preserved in the query string, while status, priority,
 * and text search are applied locally for a fast dashboard experience.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../api'
import Icon from '../components/Icons'

const SORT_OPTIONS = [
  { key: 'updated_at', label: 'Recent first' },
  { key: 'priority', label: 'By priority' },
  { key: 'title', label: 'By title' },
]

const STATUS_META = [
  { key: 'ToDo', label: 'To Do', accent: '#6e7488' },
  { key: 'InProgress', label: 'In Progress', accent: '#ff3d86' },
  { key: 'Paused', label: 'Paused', accent: '#7c5cff' },
  { key: 'Done', label: 'Done', accent: '#37d5c4' },
]

const PRIORITY_ORDER = { High: 1, Medium: 2, Low: 3 }

/** Format SQLite local timestamps for compact dashboard labels. */
function taskDate(value) {
  return value ? value.slice(0, 10) : 'No date'
}

/** Convert persisted status keys into human-friendly labels. */
function statusLabel(value) {
  return STATUS_META.find(s => s.key === value)?.label ?? value
}

/**
 * Render the main dashboard view.
 *
 * @param {object} props
 * @param {string} props.activeStatus Current sidebar status filter.
 * @param {string} props.activePriority Current sidebar priority filter.
 * @param {(tasks: Array<object>) => void} props.onTasksLoaded Updates shell counts.
 */
export default function TasksPage({ activeStatus, activePriority, onTasksLoaded }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortOpen, setSortOpen] = useState(false)
  const dropRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const sort = searchParams.get('sort') || 'updated_at'
  const search = searchParams.get('search') || ''

  // Fetch the server-sorted task list whenever the sort query changes.
  useEffect(() => {
    let cancelled = false
    api.getTasks({ sort })
      .then(d => {
        if (cancelled) return
        setData(d)
        onTasksLoaded?.(d.tasks)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [sort, onTasksLoaded])

  // Close the sort menu when users click outside the dropdown.
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Apply sidebar and search filters client-side so the dashboard remains
  // responsive without requiring a network request for every filter change.
  const tasks = useMemo(() => {
    let list = data?.tasks ?? []

    if (activeStatus && activeStatus !== 'all') {
      list = list.filter(t => t.status === activeStatus)
    }
    if (activePriority && activePriority !== 'all') {
      list = list.filter(t => t.priority === activePriority)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      )
    }

    return list
  }, [activePriority, activeStatus, data?.tasks, search])

  // Derive status and priority metrics for the chart, stats, and ring panels.
  const stats = useMemo(() => {
    const source = data?.tasks ?? []
    const total = source.length
    const statusCounts = STATUS_META.map(meta => {
      const count = source.filter(t => t.status === meta.key).length
      const pct = total ? Math.round((count / total) * 100) : 0
      return { ...meta, count, pct }
    })
    const high = source.filter(t => t.priority === 'High' && t.status !== 'Done').length
    const complete = source.filter(t => t.status === 'Done').length
    const paused = source.filter(t => t.status === 'Paused').length
    return { total, statusCounts, high, complete, paused }
  }, [data?.tasks])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const inProgressTasks = tasks.filter(t => t.status === 'InProgress')
  const otherTasks = tasks.filter(t => t.status !== 'InProgress')
  const sortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Recent first'

  const filterLabel = () => {
    if (activeStatus && activeStatus !== 'all') return statusLabel(activeStatus)
    if (activePriority && activePriority !== 'all') return activePriority
    return 'All Tasks'
  }

  const sortedPriority = [...tasks].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <>
      <div className="main-topbar">
        <div className="topbar-breadcrumb">
          <span>Dashboard</span>
          <span className="crumb-muted">Task Control</span>
        </div>
        <div className="topbar-right">
          <div className="dropdown-wrap" ref={dropRef}>
            <button type="button" className="topbar-dropdown-btn" onClick={() => setSortOpen(o => !o)}>
              {sortLabel}
              <Icon name="chevronDown" size={13} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.key}
                      type="button"
                      className={`dropdown-item${sort === o.key ? ' active' : ''}`}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams)
                        next.set('sort', o.key)
                        setSearchParams(next)
                        setSortOpen(false)
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/tasks/new" className="btn-primary">
            <Icon name="plus" size={15} />
            New Task
          </Link>
        </div>
      </div>

      <div className="main-scroll">
        {data?.show_warning && (
          <div className="load-warning">
            <Icon name="alert" size={18} />
            <div>
              <strong>Cognitive Load Warning</strong>
              <span>{data.active_count} tasks are In Progress. Pause or finish one before taking on more.</span>
            </div>
          </div>
        )}

        <section className="dashboard-grid">
          <div className="panel panel-wide">
            <div className="panel-label">Today's Info</div>
            <div className="bar-chart" aria-label="Task status distribution">
              {stats.statusCounts.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`chart-bar s-${item.key}`}
                  style={{ '--bar-height': `${Math.max(18, item.pct)}%`, '--bar-color': item.accent }}
                  onClick={() => navigate('/')}
                  aria-label={`${item.label}: ${item.count} tasks`}
                >
                  <span className="chart-count">{item.count}</span>
                  <span className="chart-fill" />
                  <span className="chart-caption">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel stats-panel">
            <div className="panel-label">Stats</div>
            <div className="big-stat">{stats.total}</div>
            <p className="panel-copy">{filterLabel()} currently visible. {tasks.length} match the active view.</p>
            <div className="spark-row" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="stat-pair-row">
              <div>
                <strong>{stats.high}</strong>
                <span>Open High Priority</span>
              </div>
              <div>
                <strong>{stats.complete}</strong>
                <span>Completed</span>
              </div>
            </div>
          </div>

          <div className="panel graph-panel">
            <div className="panel-label">Statement Graph</div>
            {stats.statusCounts.map(item => (
              <div className="ring-row" key={item.key}>
                <span className="ring" style={{ '--ring-value': `${item.pct * 3.6}deg`, '--ring-color': item.accent }} />
                <div>
                  <strong>{item.count}</strong>
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {inProgressTasks.length > 0 && (
          <section className="focus-section">
            <div className="section-heading">
              <span>In Progress</span>
              <span>{inProgressTasks.length}</span>
            </div>
            <div className="cards-grid">
              {inProgressTasks.map(task => (
                <Link key={task.id} to={`/tasks/${task.id}`} className="task-card">
                  <div className={`priority-slab p-${task.priority}`} />
                  <div className="task-card-badges">
                    <span className={`badge s-${task.status}`}>{statusLabel(task.status)}</span>
                    <span className={`badge p-${task.priority}`}>{task.priority}</span>
                  </div>
                  <div className="task-card-name">{task.title}</div>
                  <div className="task-card-meta">{taskDate(task.updated_at)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="section-heading">
            <span>{inProgressTasks.length > 0 ? 'Task Queue' : 'Tasks'}</span>
            <span>{otherTasks.length}</span>
          </div>

          {otherTasks.length > 0 ? (
            <div className="files-table-wrap">
              <table className="files-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {otherTasks.map(task => (
                    <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)}>
                      <td>
                        <div className="file-name-cell">
                          <span className={`priority-dot p-${task.priority}`} />
                          <div>
                            <div className="file-title">{task.title}</div>
                            {task.description && (
                              <div className="file-desc">
                                {task.description.slice(0, 78)}{task.description.length > 78 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge s-${task.status}`}>{statusLabel(task.status)}</span></td>
                      <td><span className={`badge p-${task.priority}`}>{task.priority}</span></td>
                      <td className="task-row-date">{taskDate(task.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            tasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Icon name="orbit" size={28} /></div>
                <h3>No tasks found</h3>
                <p>{search ? 'Try a different search.' : 'Create your first task to start the orbit.'}</p>
                {!search && <Link to="/tasks/new" className="btn-primary"><Icon name="plus" size={15} />New Task</Link>}
              </div>
            )
          )}
        </section>

        {sortedPriority.length > 0 && (
          <div className="mini-priority-strip" aria-label="Priority order preview">
            {sortedPriority.slice(0, 8).map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`} className={`mini-priority p-${task.priority}`}>
                <span>{task.priority}</span>
                <strong>{task.title}</strong>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
