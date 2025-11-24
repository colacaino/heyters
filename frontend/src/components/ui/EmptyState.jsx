// components/ui/EmptyState.jsx
import { motion } from "framer-motion";

/**
 * Empty state component para mostrar cuando no hay datos
 * @param {Object} props
 * @param {string} props.icon - Emoji o icono
 * @param {string} props.title - Título del empty state
 * @param {string} props.description - Descripción
 * @param {React.ReactNode} props.action - Botón de acción
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="text-6xl mb-4 opacity-50">
          {icon}
        </div>
      )}

      {title && (
        <h3 className="text-2xl font-bold text-white mb-2">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-gray-400 mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && action}
    </motion.div>
  );
}
