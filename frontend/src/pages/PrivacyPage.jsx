/**
 * Privacy page.
 *
 * Three sections:
 *   - Data Retention toggles: presentational controls for how long different
 *     event types are kept on disk.
 *   - Snapshot Scope toggles: presentational controls for what to include in
 *     a context snapshot.
 *   - Export & Danger Zone: working JSON exports of tasks and activity logs,
 *     plus a danger-toned clear-local-preferences action.
 */
import { useState } from 'react'
import { api } from '../api'
import Icon from '../components/Icons'
import { PageEyebrow } from '../components/Atoms'

/** Mirror the PrefsToggle from PreferencesPage so styles stay consistent. */
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

/** Trigger a download for an in-memory JSON object. */
function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

const DEFAULTS = {
  keepInterrupts: true,
  keepStatusHistory: true,
  autoDeleteDone: false,
  snapDescription: true,
  snapBlockers: true,
  snapNextStep: true,
  shareAnonymized: false,
}

export default function PrivacyPage({ onToast }) {
  const [state, setState] = useState(DEFAULTS)
  const [busy, setBusy] = useState(null)
  const set = (k, v) => setState(s => ({ ...s, [k]: v }))

  const today = new Date().toISOString().slice(0, 10)

  const exportTasks = async () => {
    setBusy('tasks')
    try {
      const d = await api.getTasks()
      downloadJson(`devorbit-tasks-${today}.json`, d)
      onToast?.('Tasks exported.')
    } catch (e) {
      onToast?.(e.message, 'error')
    } finally {
      setBusy(null)
    }
  }

  const exportActivity = async () => {
    setBusy('activity')
    try {
      const d = await api.getActivity(500)
      downloadJson(`devorbit-activity-${today}.json`, d)
      onToast?.('Activity log exported.')
    } catch (e) {
      onToast?.(e.message, 'error')
    } finally {
      setBusy(null)
    }
  }

  const clearLocal = () => {
    try {
      window.localStorage?.clear()
      window.sessionStorage?.clear()
      onToast?.('Local browser storage cleared.')
    } catch (e) {
      onToast?.(e.message, 'error')
    }
  }

  return (
    <>
      <PageEyebrow kicker="Retention · Scope · Export" title="Privacy" />

      <div className="prefs">
        <div className="panel">
          <div className="prefs__sect-head">
            <div className="panel__label">Data Retention</div>
            <p className="prefs__sect-desc">
              Control how long DevOrbit holds on to your task history.
            </p>
          </div>
          <div className="prefs__rows">
            <PrefsToggle
              label="Keep interruption history"
              sub="Persist Interruption log entries indefinitely."
              value={state.keepInterrupts}
              onChange={v => set('keepInterrupts', v)}
            />
            <PrefsToggle
              label="Keep full status history"
              sub="Persist every StatusChange event. Disable to keep only the latest."
              value={state.keepStatusHistory}
              onChange={v => set('keepStatusHistory', v)}
            />
            <PrefsToggle
              label="Auto-delete Done tasks after 30 days"
              sub="Completed tasks and their logs are purged after a month."
              value={state.autoDeleteDone}
              onChange={v => set('autoDeleteDone', v)}
            />
          </div>
        </div>

        <div className="panel">
          <div className="prefs__sect-head">
            <div className="panel__label">Snapshot Scope</div>
            <p className="prefs__sect-desc">
              Choose what the context snapshot captures when you pause a task.
            </p>
          </div>
          <div className="prefs__rows">
            <PrefsToggle
              label="Include task description"
              sub="Snapshots reference the task description for resume context."
              value={state.snapDescription}
              onChange={v => set('snapDescription', v)}
            />
            <PrefsToggle
              label="Include blockers"
              sub="Carry over any blockers noted during the work session."
              value={state.snapBlockers}
              onChange={v => set('snapBlockers', v)}
            />
            <PrefsToggle
              label="Include next step"
              sub="Prompt for the next command, file, or check when saving."
              value={state.snapNextStep}
              onChange={v => set('snapNextStep', v)}
            />
            <PrefsToggle
              label="Share anonymized analytics"
              sub="Send anonymized usage stats to help improve DevOrbit. Off by default."
              value={state.shareAnonymized}
              onChange={v => set('shareAnonymized', v)}
            />
          </div>
        </div>

        <div className="panel">
          <div className="prefs__sect-head">
            <div className="panel__label">Export Your Data</div>
            <p className="prefs__sect-desc">
              Download a JSON copy of everything DevOrbit has stored locally.
            </p>
          </div>
          <div className="priv-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={exportTasks}
              disabled={busy === 'tasks'}
            >
              <Icon name="report" size={13} />
              {busy === 'tasks' ? 'Exporting' : 'Export Tasks (JSON)'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={exportActivity}
              disabled={busy === 'activity'}
            >
              <Icon name="copy" size={13} />
              {busy === 'activity' ? 'Exporting' : 'Export Activity (JSON)'}
            </button>
          </div>
        </div>

        <div className="priv-danger">
          <div className="prefs__sect-head">
            <div className="panel__label">Danger Zone</div>
            <p className="prefs__sect-desc">
              These actions affect data stored in your browser. They do not remove tasks from the database.
            </p>
          </div>
          <div className="priv-danger__row">
            <div className="priv-danger__text">
              Reset preferences and clear cached UI state held in this browser.
              Your tasks, snapshots, and activity logs on the server are unaffected.
            </div>
            <button type="button" className="btn btn--danger" onClick={clearLocal}>
              <Icon name="alert" size={13} /> Clear Local Storage
            </button>
          </div>
        </div>

        <div className="form__actions prefs__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setState(DEFAULTS)}
          >
            Reset to defaults
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onToast?.('Privacy preferences saved.')}
          >
            <Icon name="check" size={13} /> Save changes
          </button>
        </div>
      </div>
    </>
  )
}
