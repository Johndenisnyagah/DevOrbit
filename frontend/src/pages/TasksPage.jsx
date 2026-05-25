/**
 * Dashboard page.
 *
 * Today's overview: a 7-day activity chart, a stats panel, the statement
 * graph (one donut per status), the In Progress focus cards, and the Task
 * Queue table with a sort menu.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Icon from '../components/Icons'
import { PageEyebrow, GraphRing } from '../components/Atoms'
import { STATUS_META, fmtFull, fmtDate, statusLabel } from '../helpers'

const SORT_OPTIONS = [
  { key: 'updated_at', label: 'Recent first' },
  { key: 'priority',   label: 'By priority'  },
  { key: 'title',      label: 'By title'     },
]
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

/**
 * Map the backend's per-day event series into render-ready bars.
 *
 * Bars scale to the busiest day in the window: the tallest day is 100%
 * of the chart's bar area, every other day is its fraction of that max,
 * and zero-count days collapse to a small visible stub so the gap reads
 * as "no activity" rather than "missing data".
 */
function buildChartData(series) {
  const max = Math.max(1, ...series.map(d => d.count))
  return series.map(d => {
    const date = new Date(`${d.date}T00:00:00`)
    const fraction = d.count / max
    // 8% baseline keeps an empty day visible without faking activity.
    const pct = d.count === 0 ? 8 : 12 + fraction * 88
    return {
      iso: d.date,
      day: date.getDate(),
      mo: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      count: d.count,
      isToday: d.is_today,
      pct,
    }
  })
}

export default function TasksPage({ onToast }) {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [interruptCount, setInterruptCount] = useState(0)
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('updated_at')
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)

  // One request feeds every dashboard panel: task list, cognitive-load
  // flags, the interruption counter, and the chart series.
  useEffect(() => {
    let cancelled = false
    api.getDashboard(7)
      .then(payload => {
        if (cancelled) return
        setData(payload)
        setInterruptCount(payload.interrupted_today ?? 0)
        setDaily(payload.activity?.series ?? [])
      })
      .catch(e => onToast?.(e.message, 'error'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [onToast])

  // Close the sort menu on outside click.
  useEffect(() => {
    const h = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks])
  const chartData = useMemo(() => buildChartData(daily), [daily])
  const sevenDay = chartData.reduce((s, d) => s + d.count, 0)

  const total = tasks.length
  const statusCounts = STATUS_META.map(meta => {
    const count = tasks.filter(t => t.status === meta.key).length
    return { ...meta, count, pct: total ? count / total : 0 }
  })

  const inProgress = tasks.filter(t => t.status === 'InProgress')
  const queue = tasks.filter(t => t.status !== 'InProgress' && t.status !== 'Done')
  const sortedQueue = useMemo(() => {
    const arr = [...queue]
    if (sort === 'updated_at') arr.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
    if (sort === 'priority')   arr.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    if (sort === 'title')      arr.sort((a, b) => a.title.localeCompare(b.title))
    return arr
  }, [queue, sort])
  const sortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Recent first'

  const done = tasks.filter(t => t.status === 'Done').length

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <>
      <PageEyebrow kicker="Today · Developer Focus Desk" title="Dashboard" />

      {data?.show_warning && (
        <div className="load-warning" role="alert">
          <Icon name="alert" size={18} />
          <div>
            <strong>Cognitive Load Warning</strong>
            <span>
              {data.active_count} tasks are In Progress. Pause or finish one before taking on more.
            </span>
          </div>
        </div>
      )}

      <section className="dash">
        <div className="panel dash__info">
          <div className="panel__head">
            <span className="panel__label">Today's Info</span>
            <span className="eyebrow" style={{ color: 'var(--t4)' }}>
              Last 7 Days · {sevenDay} Events
            </span>
          </div>
          <div className="chart" aria-label="Last 7 days of task activity">
            {chartData.map(d => (
              <div
                key={d.iso}
                className={`bar${d.isToday ? ' bar--active' : ''}`}
                style={{ '--bar-h': `${d.pct}%` }}
                aria-label={`${d.day} ${d.mo}: ${d.count} events`}
              >
                {d.isToday ? (
                  <span className="bar__cap">
                    <span className="bar__cap-inner">
                      <span className="bar__cap-day">{d.day}</span>
                      <span className="bar__cap-mo">{d.mo}</span>
                    </span>
                  </span>
                ) : (
                  <span className="bar__cap">
                    <span className="bar__cap-day">{d.day}</span>
                    <span className="bar__cap-mo">{d.mo}</span>
                  </span>
                )}
                <span className="bar__fill" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel dash__stats">
          <div className="panel__label">Stats</div>
          <div className="stats__num">{total.toLocaleString()}</div>
          <p className="stats__caption">
            Active workload across all priorities, paused contexts, and tasks
            you have on a tight loop today.
          </p>
          <div className="stats__dots" aria-hidden="true">
            <span className="stats__dot" />
            <span className="stats__dot" />
            <span className="stats__dot stats__dot--dim" />
          </div>
          <div className="stats__pair">
            <div>
              <div className="stats__pair-num stats__pair-pos">{done + inProgress.length}</div>
              <div className="stats__pair-lbl">Active &amp; Done</div>
            </div>
            <div>
              <div className="stats__pair-num stats__pair-neg">{interruptCount}</div>
              <div className="stats__pair-lbl">Interruptions</div>
            </div>
          </div>
        </div>

        <div className="panel dash__graph">
          <div className="panel__label" style={{ marginBottom: 18 }}>Statement Graph</div>
          <div className="graph">
            {statusCounts.map(s => (
              <div key={s.key} className="gring">
                <GraphRing pct={s.pct} color={s.ring} />
                <div>
                  <div className="gring__num" style={{ '--ring-c': s.ring }}>
                    {s.count.toLocaleString()}
                  </div>
                  <div className="gring__lbl">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {inProgress.length > 0 && (
        <section>
          <div className="sect">
            <div className="sect__title">
              <span className="panel__label">In Progress</span>
              <span className="sect__count">{inProgress.length}</span>
            </div>
            <span className="eyebrow" style={{ color: 'var(--t4)' }}>Focus Now</span>
          </div>
          <div className="cards">
            {inProgress.map(t => (
              <article
                key={t.id}
                className="card"
                onClick={() => navigate(`/tasks/${t.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/tasks/${t.id}`) }}
              >
                <span className={`card__slab p-${t.priority}`} />
                <div className="card__badges">
                  <span className={`badge s-${t.status}`}>{statusLabel(t.status)}</span>
                  <span className={`badge p-${t.priority}`}>{t.priority}</span>
                </div>
                <div className="card__title">{t.title}</div>
                <div className="card__meta">{fmtFull(t.updated_at)}</div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="sect">
          <div className="sect__title">
            <span className="panel__label">Task Queue</span>
            <span className="sect__count">{queue.length}</span>
          </div>
          <div className="dropdown" ref={sortRef}>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ height: 30, padding: '0 12px' }}
              onClick={() => setSortOpen(o => !o)}
            >
              {sortLabel} <Icon name="chev" size={12} />
            </button>
            {sortOpen && (
              <div className="dropdown__menu" role="menu">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.key}
                    type="button"
                    role="menuitem"
                    className={`dropdown__item${o.key === sort ? ' dropdown__item--active' : ''}`}
                    onClick={() => { setSort(o.key); setSortOpen(false) }}
                  >
                    {o.label}
                    {o.key === sort && (
                      <span className="dropdown__check">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {sortedQueue.length > 0 ? (
          <div className="queue">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {sortedQueue.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)}>
                    <td>
                      <div className="queue__name">
                        <span className={`dot p-${t.priority}`} />
                        <div>
                          <div className="queue__name-title">{t.title}</div>
                          {t.description && <div className="queue__name-desc">{t.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge s-${t.status}`}>{statusLabel(t.status)}</span></td>
                    <td><span className={`badge p-${t.priority}`}>{t.priority}</span></td>
                    <td className="mono" style={{ color: 'var(--t4)', fontSize: 11 }}>
                      {fmtDate(t.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty">
            <div className="empty__icon"><Icon name="orbit" size={20} /></div>
            <h3>No tasks yet</h3>
            <p>Create your first task to start the orbit.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate('/tasks/new')}
            >
              <Icon name="plus" size={13} /> New Task
            </button>
          </div>
        ) : (
          <div className="empty">
            <p>The queue is clear. All open work is currently In Progress.</p>
          </div>
        )}
      </section>
    </>
  )
}
