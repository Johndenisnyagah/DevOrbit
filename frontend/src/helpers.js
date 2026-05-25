/**
 * Shared constants and small formatting helpers used across DevOrbit screens.
 *
 * Kept in a plain module (not a JSX file) so Vite's react-refresh plugin can
 * keep fast refresh intact for the component files that depend on them.
 */

/** Status metadata (label, ring color) used by dashboard rings and badges. */
export const STATUS_META = [
  { key: 'ToDo',       label: 'To Do',       ring: '#6e7488' },
  { key: 'InProgress', label: 'In Progress', ring: '#ff3a86' },
  { key: 'Paused',     label: 'Paused',      ring: '#b794ff' },
  { key: 'Done',       label: 'Done',        ring: '#4ed9c6' },
]

/** Priority metadata used by the priority picker on the Create Task form. */
export const PRIORITY_META = [
  { key: 'High',   label: 'High'   },
  { key: 'Medium', label: 'Medium' },
  { key: 'Low',    label: 'Low'    },
]

/** Convert a status key into its user-facing label. */
export function statusLabel(s) {
  return STATUS_META.find(x => x.key === s)?.label ?? s
}

/** Format a SQLite local timestamp as `YYYY-MM-DD HH:mm`. */
export function fmtFull(s) {
  if (!s) return '—'
  return s.slice(0, 16).replace('T', ' ')
}

/** Format a SQLite local timestamp as `YYYY-MM-DD`. */
export function fmtDate(s) {
  if (!s) return '—'
  return s.slice(0, 10)
}
