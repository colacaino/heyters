// components/ui/Input.jsx
import clsx from "clsx";

/**
 * Input component con soporte para labels, errores y estados
 * @param {Object} props
 * @param {string} props.label - Label del input
 * @param {string} props.error - Mensaje de error
 * @param {string} props.helperText - Texto de ayuda
 * @param {React.ReactNode} props.leftIcon - Ícono a la izquierda
 * @param {React.ReactNode} props.rightIcon - Ícono a la derecha
 * @param {boolean} props.fullWidth - Ocupa todo el ancho disponible
 */
export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  ...props
}) {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx("flex flex-col gap-1.5", fullWidth && "w-full")}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={clsx(
            "w-full px-4 py-3 bg-white/5 border rounded-lg transition-all duration-200",
            "text-white placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-white/10 focus:border-purple-500 focus:ring-purple-500",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            props.disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
