// components/ui/Skeleton.jsx
import clsx from "clsx";

/**
 * Skeleton loading component
 * @param {Object} props
 * @param {string} props.variant - text, circular, rectangular
 * @param {string} props.width - Ancho del skeleton
 * @param {string} props.height - Alto del skeleton
 */
export default function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
}) {
  const baseStyles = "animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]";

  const variants = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style = {
    width: width || (variant === "text" ? "100%" : undefined),
    height: height || (variant === "text" ? "1rem" : "100%"),
  };

  return (
    <div
      className={clsx(baseStyles, variants[variant], className)}
      style={style}
    />
  );
}
