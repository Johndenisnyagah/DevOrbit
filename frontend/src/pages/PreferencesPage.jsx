/**
 * Preferences page.
 *
 * Three stacked panels — Profile, Workflow, Notifications — plus a footer
 * action row with Reset / Save controls. State is local to the page; the
 * backend has no preference endpoints yet, so Save is a presentational stub
 * that emits a toast.
 */
import { useState } from 'react'
import Icon from '../components/Icons'
import { PageEyebrow } from '../components/Atoms'

/**
 * Single toggle row used inside the Preferences panels.
 *
 * @param {object} props
 * @param {string} props.label Toggle label shown to the user.
 * @param {string} [props.sub] Optional sub-copy beneath the label.
 * @param {boolean} props.value Current toggle state.
 * @param {(next: boolean) => void} props.onChange Setter.
 */
function PrefsToggle({ label, sub, value, onChange }) {
  return (
    <div className="prefs__row">
      <div className="prefs__row-text">
        <div className="prefs__label">{label}</div>
        {sub && <div className="prefs__sub">{sub}</div>}
      </div>
      <button
        type="button"
        className={`tswitch${value ? ' tswitch--on' : ''}`}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <span className="tswitch__thumb" />
      </button>
    </div>
  )
}

const DEFAULTS = {
  name: 'John Dennis',
  role: 'Senior Engineer',
  email: 'john.dennis@orbit.dev',
  autoSnap: true,
  cogLoad: true,
  emailDigest: false,
  slackNotif: true,
  weeklyReport: true,
}

export default function PreferencesPage({ onToast }) {
  const [state, setState] = useState(DEFAULTS)
  const set = (k, v) => setState(s => ({ ...s, [k]: v }))

  return (
    <>
      <PageEyebrow kicker="Account · Configuration" title="Preferences" />

      <div className="prefs">
        <div className="panel">
          <div className="prefs__sect-head">
            <div className="panel__label">Profile</div>
            <p className="prefs__sect-desc">
              Your identity in DevOrbit. Shown in the sidebar and on the standup report.
            </p>
          </div>
          <div className="prefs__rows">
            <div className="prefs__row">
              <div className="prefs__row-text">
                <div className="prefs__label">Display name</div>
                <div className="prefs__sub">Shown across the app.</div>
              </div>
              <input
                className="field prefs__field"
                value={state.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div className="prefs__row">
              <div className="prefs__row-text">
                <div className="prefs__label">Role</div>
                <div className="prefs__sub">Optional context tag.</div>
              </div>
              <input
                className="field prefs__field"
                value={state.role}
                onChange={e => set('role', e.target.value)}
              />
            </div>
            <div className="prefs__row">
              <div className="prefs__row-text">
                <div className="prefs__label">Email</div>
                <div className="prefs__sub">Used for the daily digest.</div>
              </div>
              <input
                className="field prefs__field"
                type="email"
                value={state.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="prefs__sect-head">
            <div className="panel__label">Workflow</div>
            <p className="prefs__sect-desc">Defaults for how DevOrbit guards your focus.</p>
          </div>
          <div className="prefs__rows">
            <PrefsToggle
              label="Auto-snapshot on pause"
              sub="When you pause a task, jump straight to the snapshot form."
              value={state.autoSnap}
              onChange={v => set('autoSnap', v)}
            />
            <PrefsToggle
              label="Cognitive load warning"
              sub="Warn when three or more tasks are In Progress at once."
              value={state.cogLoad}
              onChange={v => set('cogLoad', v)}
            />
          </div>
        </div>

        <div className="panel">
          <div className="prefs__sect-head">
            <div className="panel__label">Notifications</div>
            <p className="prefs__sect-desc">How and where DevOrbit reaches you.</p>
          </div>
          <div className="prefs__rows">
            <PrefsToggle
              label="Daily email digest"
              sub="Get your standup summary at 09:00 every weekday."
              value={state.emailDigest}
              onChange={v => set('emailDigest', v)}
            />
            <PrefsToggle
              label="Slack mentions"
              sub="DM me when a teammate references a task I own."
              value={state.slackNotif}
              onChange={v => set('slackNotif', v)}
            />
            <PrefsToggle
              label="Weekly review report"
              sub="Friday recap of completed tasks, interruptions, and time held in pause."
              value={state.weeklyReport}
              onChange={v => set('weeklyReport', v)}
            />
          </div>
        </div>

        <div className="form__actions prefs__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setState(DEFAULTS)}>
            Reset to defaults
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onToast?.('Preferences saved.')}
          >
            <Icon name="check" size={13} /> Save changes
          </button>
        </div>
      </div>
    </>
  )
}
