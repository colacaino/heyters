// components/ui/Badge.jsx
import clsx from "clsx";

/**
 * Badge component para etiquetas y estados
 * @param {Object} props
 * @param {string} props.variant - primary, secondary, success, danger, warning, info
 * @param {string} props.size - sm, md, lg
 * @param {React.ReactNode} props.children - Contenido del badge
 */
export default function Badge({
  variant = "primary",
  size = "md",
  className = "",
  children,
}) {
  const baseStyles =
    "inline-flex items-center gap-1 font-semibold rounded-full";

  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30",
    secondary: "bg-gray-700/50 text-gray-300 border border-gray-600/50",
    success: "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30",
    danger: "bg-red-600/20 text-red-300 border border-red-500/30",
    warning: "bg-amber-600/20 text-amber-300 border border-amber-500/30",
    info: "bg-blue-600/20 text-blue-300 border border-blue-500/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span className={clsx(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
