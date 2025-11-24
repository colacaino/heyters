// components/ui/Button.jsx
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Button component con variantes y tamaños
 * @param {Object} props
 * @param {string} props.variant - primary, secondary, danger, success, ghost, outline
 * @param {string} props.size - sm, md, lg, xl
 * @param {boolean} props.isLoading - Muestra loading state
 * @param {boolean} props.disabled - Deshabilita el botón
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {React.ReactNode} props.leftIcon - Ícono a la izquierda
 * @param {React.ReactNode} props.rightIcon - Ícono a la derecha
 * @param {boolean} props.fullWidth - Ocupa todo el ancho disponible
 */
export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50 focus:ring-purple-500",
    secondary:
      "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 focus:ring-gray-600",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/50 focus:ring-red-500",
    success:
      "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/50 focus:ring-emerald-500",
    ghost:
      "bg-transparent hover:bg-white/10 text-gray-300 hover:text-white focus:ring-purple-500",
    outline:
      "bg-transparent border-2 border-purple-500 hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 focus:ring-purple-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl",
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
}
