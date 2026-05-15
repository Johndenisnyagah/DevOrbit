import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icons'

/**
 * Animated toast stack.
 *
 * Toast state is owned by the app shell. This component is intentionally
 * presentational: it renders messages, handles exit animation, and delegates
 * dismissal through `onRemove`.
 */
export default function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`toast${t.type === 'error' ? ' error' : ''}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
          >
            <span>{t.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => onRemove(t.id)}
              aria-label="Dismiss notification"
            >
              <Icon name="close" size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
