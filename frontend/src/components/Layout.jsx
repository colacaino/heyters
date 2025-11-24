// components/Layout.jsx
import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { Badge } from "./ui";

/**
 * Layout general de la app autenticada con navegación persistente.
 */
export default function Layout({ title, description, children, rightSlot = null }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canRap = Boolean(user?.canRap || user?.isDemoUser);
  const canModerate = Boolean(user?.canModerate || user?.isDemoUser);
  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin");

  const navItems = [
    { label: "Inicio", icon: "\u{1F3E0}", path: "/home", visible: true },
    { label: "Eventos", icon: "\u{1F39F}", path: "/events", visible: true },
    { label: "Clasificacion", icon: "\u{1F4CA}", path: "/leaderboards", visible: true },
    { label: "Notificaciones", icon: "\u{1F514}", path: "/notifications", visible: true },
    { label: "Perfil", icon: "\u{1F464}", path: "/profile", visible: true },
    { label: "Premium", icon: "\u{1F48E}", path: "/payment", visible: true },
    { label: "Crear batalla", icon: "\u2694\uFE0F", path: "/create-battle", visible: canRap },
    { label: "Panel Admin", icon: "\u{1F6E0}\uFE0F", path: "/admin", visible: isAdmin },
  ].filter((item) => item.visible);

  const getRoleBadge = () => {
    if (isAdmin) return { label: "Admin", variant: "danger" };
    if (canModerate && !canRap) return { label: "Moderador", variant: "primary" };
    if (canRap) return { label: "MC", variant: "success" };
    return { label: "Espectador", variant: "secondary" };
  };
  const roleBadge = getRoleBadge();

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div
              className="cursor-pointer group"
              onClick={() => navigate("/home")}
            >
              <p className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                HEYTERS
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
                Batallas en vivo
              </p>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActivePath(item.path)
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User Info & Logout (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
                  <Badge variant={roleBadge.variant} size="sm">
                    {roleBadge.label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
                {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 text-sm rounded-lg border border-white/20 hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
              >
                Salir
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-white/10 bg-black/60 backdrop-blur-lg overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {/* User info on mobile */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold">
                    {(user?.displayName || user?.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
                      <Badge variant={roleBadge.variant} size="sm">
                        {roleBadge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>

                {/* Nav items */}
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-medium text-left transition-all ${
                      isActivePath(item.path)
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 hover:bg-white/10 text-gray-300"
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                ))}

                {/* Logout on mobile */}
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 mt-4 text-sm rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            {title && <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>}
            {description && <p className="text-gray-300 mt-2">{description}</p>}
          </div>
          {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
