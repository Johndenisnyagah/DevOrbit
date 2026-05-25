import { useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Toast   from './components/Toast'
import TasksPage       from './pages/TasksPage'
import TaskDetailPage  from './pages/TaskDetailPage'
import TaskCreatePage  from './pages/TaskCreatePage'
import SnapshotPage    from './pages/SnapshotPage'
import StandupPage     from './pages/StandupPage'
import PreferencesPage from './pages/PreferencesPage'
import TaskTreePage    from './pages/TaskTreePage'
import SecurityPage    from './pages/SecurityPage'
import PrivacyPage     from './pages/PrivacyPage'

/**
 * Manage transient toast notifications for the app shell.
 *
 * Toast IDs are generated with a ref so renders remain deterministic while
 * each notification can still be removed individually after its timeout.
 */
function useToasts() {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const add = (message, type = 'success') => {
    nextId.current += 1
    const id = nextId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  return { toasts, add, remove }
}

/**
 * Root application shell.
 *
 * Renders the persistent sidebar, route outlet, and toast stack. Tree,
 * Security, and Privacy routes render a shared "coming soon" placeholder
 * until those features ship.
 */
export default function App() {
  const { toasts, add: addToast, remove: removeToast } = useToasts()

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="app-main__scroll hide-scrollbar">
          <Routes>
            <Route path="/"                    element={<TasksPage onToast={addToast}/>}/>
            <Route path="/tasks/new"           element={<TaskCreatePage onToast={addToast}/>}/>
            <Route path="/tasks/:id"           element={<TaskDetailPage onToast={addToast}/>}/>
            <Route path="/tasks/:id/snapshot"  element={<SnapshotPage onToast={addToast}/>}/>
            <Route path="/standup"             element={<StandupPage/>}/>
            <Route path="/preferences"         element={<PreferencesPage onToast={addToast}/>}/>
            <Route path="/tree"                element={<TaskTreePage onToast={addToast}/>}/>
            <Route path="/security"            element={<SecurityPage onToast={addToast}/>}/>
            <Route path="/privacy"             element={<PrivacyPage onToast={addToast}/>}/>
          </Routes>
        </div>
      </main>

      <Toast toasts={toasts} onRemove={removeToast}/>
    </div>
  )
}
