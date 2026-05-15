import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Icon from './Icons'

// Filter definitions are kept close to the sidebar because they drive both the
// visible navigation labels and the count calculations.
const STATUS_ITEMS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'ToDo', label: 'To Do' },
  { key: 'InProgress', label: 'In Progress' },
  { key: 'Paused', label: 'Paused' },
  { key: 'Done', label: 'Done' },
]

const PRIORITY_ITEMS = [
  { key: 'all', label: 'All Priorities' },
  { key: 'High', label: 'High' },
  { key: 'Medium', label: 'Medium' },
  { key: 'Low', label: 'Low' },
]

/**
 * Persistent application navigation and task filter panel.
 *
 * The sidebar receives the shared task list from the app shell so counts remain
 * accurate across dashboard, detail, create, snapshot, and standup routes.
 */
export default function Sidebar({ tasks = [], activeStatus, activePriority, onFilter }) {
  const [tab, setTab] = useState('status')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  /** Count tasks for the selected status or priority filter. */
  const countFor = (key, field) => {
    if (key === 'all') return tasks.length
    return tasks.filter(t => t[field] === key).length
  }

  const items = tab === 'status' ? STATUS_ITEMS : PRIORITY_ITEMS
  const field = tab === 'status' ? 'status' : 'priority'
  const active = tab === 'status' ? activeStatus : activePriority

  /** Submit sidebar search by encoding it into the dashboard query string. */
  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <>
      <div className="icon-rail">
        <NavLink to="/" className="brand-mark" title="DevOrbit">
          <Icon name="orbit" size={18} />
        </NavLink>

        <NavLink to="/" className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}`} title="Dashboard">
          <Icon name="dashboard" size={17} />
        </NavLink>

        <NavLink to="/standup" className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}`} title="Standup">
          <Icon name="standup" size={17} />
        </NavLink>

        <NavLink to="/tasks/new" className={({ isActive }) => `rail-btn${isActive ? ' active' : ''}`} title="New Task">
          <Icon name="plus" size={18} />
        </NavLink>
      </div>

      <aside className="sidebar-panel" aria-label="Task filters">
        <div className="profile-block">
          <div className="avatar-tile">
            <Icon name="user" size={18} />
          </div>
          <div>
            <div className="profile-name">DevOrbit</div>
            <div className="profile-role">Developer focus desk</div>
          </div>
        </div>

        <div className="sidebar-search">
          <div className="search-input-wrap">
            <Icon name="search" size={14} />
            <input
              className="search-input"
              placeholder="Search tasks"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
            />
          </div>
        </div>

        <div className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-row${isActive ? ' active' : ''}`}>
            <Icon name="dashboard" size={16} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/standup" className={({ isActive }) => `nav-row${isActive ? ' active' : ''}`}>
            <Icon name="standup" size={16} />
            <span>Standup</span>
          </NavLink>
        </div>

        <div className="sidebar-tabs" role="tablist" aria-label="Filter type">
          <button type="button" className={`sidebar-tab${tab === 'status' ? ' active' : ''}`} onClick={() => setTab('status')}>
            Status
          </button>
          <button type="button" className={`sidebar-tab${tab === 'priority' ? ' active' : ''}`} onClick={() => setTab('priority')}>
            Priority
          </button>
        </div>

        <div className="sidebar-tree">
          {items.map(item => (
            <button
              key={item.key}
              type="button"
              className={`tree-item ${field}-${item.key}${active === item.key ? ' active' : ''}`}
              onClick={() => onFilter(field, item.key)}
            >
              <span className="tree-item-icon" />
              <span className="tree-item-label">{item.label}</span>
              <span className="tree-item-count">{countFor(item.key, field)}</span>
            </button>
          ))}
        </div>

        <NavLink to="/tasks/new" className="sidebar-create">
          <Icon name="plus" size={16} />
          <span>New Task</span>
        </NavLink>
      </aside>
    </>
  )
}
