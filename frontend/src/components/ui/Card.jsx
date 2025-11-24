// components/ui/Card.jsx
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Card component con variantes y animación
 * @param {Object} props
 * @param {string} props.variant - default, glass, elevated, outlined
 * @param {boolean} props.hoverable - Añade efecto hover
 * @param {boolean} props.clickable - Añade cursor pointer
 * @param {React.ReactNode} props.children - Contenido de la card
 */
export default function Card({
  variant = "default",
  hoverable = false,
  clickable = false,
  className = "",
  children,
  ...props
}) {
  const baseStyles =
    "rounded-2xl transition-all duration-200";

  const variants = {
    default: "bg-gray-900/70 border border-white/10",
    glass: "bg-white/5 backdrop-blur-xl border border-white/10",
    elevated: "bg-gray-900 border border-white/10 shadow-2xl shadow-black/50",
    outlined: "bg-transparent border-2 border-purple-500/30",
  };

  const hoverStyles = hoverable
    ? "hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10"
    : "";

  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.02, y: -4 } : {}}
      className={clsx(
        baseStyles,
        variants[variant],
        hoverStyles,
        clickable && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
