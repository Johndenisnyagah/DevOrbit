import { useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Toast   from './components/Toast'
import TasksPage      from './pages/TasksPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskCreatePage from './pages/TaskCreatePage'
import SnapshotPage   from './pages/SnapshotPage'
import StandupPage    from './pages/StandupPage'
import { api } from './api'

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
 * Owns global task filter state for the sidebar, shared toast state, and the
 * route table for the active React frontend.
 */
export default function App() {
  const { toasts, add: addToast, remove: removeToast } = useToasts()
  const [allTasks, setAllTasks]       = useState([])
  const [activeStatus,   setActiveStatus]   = useState('all')
  const [activePriority, setActivePriority] = useState('all')

  // Load sidebar counts globally so navigation stays accurate on deep links.
  useEffect(() => {
    let cancelled = false
    api.getTasks()
      .then(d => {
        if (!cancelled) setAllTasks(d.tasks)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  /**
   * Keep status and priority filters mutually exclusive.
   *
   * This mirrors the sidebar UI: users are either viewing one status group or
   * one priority group, not a combined query.
   */
  const handleFilter = (field, key) => {
    if (field === 'status')   { setActiveStatus(key);   setActivePriority('all') }
    if (field === 'priority') { setActivePriority(key); setActiveStatus('all')   }
  }

  return (
    <div className="app-shell">
      <Sidebar
        tasks={allTasks}
        activeStatus={activeStatus}
        activePriority={activePriority}
        onFilter={handleFilter}
      />

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <TasksPage
              activeStatus={activeStatus}
              activePriority={activePriority}
              onTasksLoaded={setAllTasks}
              onToast={addToast}
            />
          }/>
          <Route path="/tasks/new"          element={<TaskCreatePage onToast={addToast}/>}/>
          <Route path="/tasks/:id"          element={<TaskDetailPage onToast={addToast}/>}/>
          <Route path="/tasks/:id/snapshot" element={<SnapshotPage  onToast={addToast}/>}/>
          <Route path="/standup"            element={<StandupPage/>}/>
        </Routes>
      </main>

      <Toast toasts={toasts} onRemove={removeToast}/>
    </div>
  )
}
