/**
 * Inline SVG icon registry used by the DevOrbit interface.
 *
 * Icons follow a 24x24 viewBox with 1.75 stroke and rounded caps/joins to
 * match the design system.
 */
const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  tree: (
    <>
      <path d="M5 4v16M5 8h7a3 3 0 0 1 3 3v0M15 11h0M5 16h7a3 3 0 0 0 3-3v0M19 8h-4M19 16h-4M19 12h-2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V5l-7-2Z" />
      <path d="m9 11 2 2 4-4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  report: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  play: <path d="M8 5v14l11-7z" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 17v5" />
      <path d="M8 3h8l-1 7 3 3v2H6v-2l3-3z" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </>
  ),
  chev: <path d="m6 9 6 6 6-6" />,
  orbit: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M3.5 12c2.6-4.7 5.4-7 8.5-7s5.9 2.3 8.5 7c-2.6 4.7-5.4 7-8.5 7s-5.9-2.3-8.5-7Z" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
}

/**
 * Render a named icon from the local SVG path registry.
 *
 * @param {object} props
 * @param {keyof paths} props.name Icon name from the registry.
 * @param {number} [props.size=16] Width and height in pixels.
 * @param {number} [props.strokeWidth=1.75] SVG stroke width.
 * @param {object} [props.style] Inline style overrides.
 * @param {string} [props.className] Optional CSS class.
 */
export default function Icon({ name, size = 16, strokeWidth = 1.75, style, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
