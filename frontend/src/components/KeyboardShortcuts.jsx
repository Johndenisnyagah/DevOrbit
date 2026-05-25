/**
 * Global keyboard shortcut handler + cheatsheet overlay.
 *
 * Listens for keydown events on the window and dispatches single-key and
 * two-key "g <x>" sequences. Shortcuts never fire while focus is inside
 * an input, textarea, or contenteditable element so typing into a form
 * never triggers navigation.
 *
 * Press `?` to open the cheatsheet, Escape to close.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icons'

const SHORTCUTS = [
  { keys: ['?'],        label: 'Show this help' },
  { keys: ['n'],        label: 'New task' },
  { keys: ['g', 'd'],   label: 'Go to Dashboard' },
  { keys: ['g', 't'],   label: 'Go to Task Tree' },
  { keys: ['g', 'r'],   label: 'Go to Standup (Report)' },
  { keys: ['g', 'p'],   label: 'Go to Preferences' },
  { keys: ['g', 's'],   label: 'Go to Security' },
  { keys: ['g', 'v'],   label: 'Go to Privacy' },
  { keys: ['Esc'],      label: 'Close menus and overlays' },
]

/** Is focus currently inside a text-editing surface? */
function isEditing(target) {
  if (!target) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export default function KeyboardShortcuts() {
  const navigate = useNavigate()
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    let leader = null
    let leaderTimer = null

    const clearLeader = () => {
      leader = null
      if (leaderTimer) { clearTimeout(leaderTimer); leaderTimer = null }
    }

    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditing(e.target)) return

      // Escape always closes the help overlay (handled by the overlay too,
      // but we want this work whether or not the overlay is mounted).
      if (e.key === 'Escape') {
        setHelpOpen(false)
        clearLeader()
        return
      }

      // Help.
      if (e.key === '?') {
        e.preventDefault()
        setHelpOpen(o => !o)
        clearLeader()
        return
      }

      // Two-key "g <x>" sequence.
      if (leader === 'g') {
        const map = {
          d: '/',
          t: '/tree',
          r: '/standup',
          p: '/preferences',
          s: '/security',
          v: '/privacy',
        }
        const path = map[e.key.toLowerCase()]
        clearLeader()
        if (path) {
          e.preventDefault()
          navigate(path)
        }
        return
      }
      if (e.key === 'g') {
        leader = 'g'
        leaderTimer = setTimeout(clearLeader, 1200)
        return
      }

      // Single-key shortcuts.
      if (e.key === 'n') {
        e.preventDefault()
        navigate('/tasks/new')
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearLeader()
    }
  }, [navigate])

  if (!helpOpen) return null

  return (
    <div
      className="kbd-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={() => setHelpOpen(false)}
    >
      <div className="kbd-panel" onClick={e => e.stopPropagation()}>
        <div className="kbd-panel__head">
          <span className="panel__label">Keyboard Shortcuts</span>
          <button
            type="button"
            className="kbd-panel__close"
            onClick={() => setHelpOpen(false)}
            aria-label="Close"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
        <ul className="kbd-list">
          {SHORTCUTS.map(s => (
            <li key={s.keys.join(' ')} className="kbd-row">
              <span className="kbd-row__keys">
                {s.keys.map((k, i) => (
                  <kbd key={i} className="kbd">{k}</kbd>
                ))}
              </span>
              <span className="kbd-row__label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
