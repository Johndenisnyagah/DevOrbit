import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icons'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',  icon: 'dashboard', path: '/' },
  { key: 'tree',      label: 'Task Tree',  icon: 'tree',      path: '/tree' },
  { key: 'standup',   label: 'Standup',    icon: 'report',    path: '/standup' },
  { key: 'security',  label: 'Security',   icon: 'shield',    path: '/security' },
  { key: 'privacy',   label: 'Privacy',    icon: 'lock',      path: '/privacy' },
]

const USER = { name: 'John Dennis', role: 'Senior Engineer' }

/**
 * Persistent application navigation rail.
 *
 * Mirrors the DevOrbit design: profile block at the top, five navigation
 * items, a flex spacer, then a footer with a focus quote and a Preferences
 * CTA. Active state is derived from the current route.
 */
export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const initials = USER.name
    .split(/\s+/)
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/tasks')
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }
  const prefsActive = location.pathname === '/preferences'

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="profile">
        <div className="avatar">
          <span className="avatar__initials">{initials}</span>
        </div>
        <div className="profile__text">
          <div className="profile__name">{USER.name}</div>
          <div className="profile__role">{USER.role}</div>
        </div>
      </div>

      <nav className="nav" aria-label="Sections">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            type="button"
            className={`nav__item${isActive(item.path) ? ' nav__item--active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon name={item.icon} size={15} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__divider" />

      <div className="sidebar__footer">
        <p className="sidebar__quote">
          Save context before you switch. Future-you is a stranger; leave them a note.
        </p>
        <button
          type="button"
          className={`sidebar__cta${prefsActive ? ' sidebar__cta--active' : ''}`}
          onClick={() => navigate('/preferences')}
        >
          Preferences
        </button>
      </div>
    </aside>
  )
}
