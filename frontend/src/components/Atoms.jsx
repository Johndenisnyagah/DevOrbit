/**
 * Shared component atoms used across DevOrbit screens.
 *
 * Non-component helpers (formatters, metadata) live in `../helpers.js` so
 * react-refresh can keep working on this file.
 */

/**
 * Page-level eyebrow + title header.
 *
 * @param {object} props
 * @param {string} props.kicker Uppercase tracked label above the title.
 * @param {string} props.title Page title rendered at 22px / weight 600.
 */
export function PageEyebrow({ kicker, title }) {
  return (
    <div className="page-eyebrow">
      <div className="page-eyebrow__kicker">{kicker}</div>
      <div className="page-eyebrow__title">{title}</div>
    </div>
  )
}

/**
 * Anti-aliased SVG donut used by the dashboard statement-graph rows.
 *
 * Renders a faint track, a soft inner glow, and a crisp progress arc with
 * rounded line caps so the ring reads cleanly at small sizes.
 */
export function GraphRing({ pct, color, size = 30, stroke = 3.5 }) {
  const safe = Math.max(0.04, Math.min(1, pct))
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const offset = C * (1 - safe)
  const filterId = `gring-glow-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flex: `0 0 ${size}px`, overflow: 'visible', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeOpacity="0.45"
        strokeDasharray={C} strokeDashoffset={offset}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={C} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
