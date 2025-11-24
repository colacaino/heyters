// src/pages/LandingPage.jsx
import { Link } from "react-router-dom";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      {/* Navigation */}
      <nav className="relative bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                🎤 HEYTERS
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-white hover:text-purple-300 transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                Registrarse
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/login"
                className="block px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md font-semibold"
              >
                Registrarse
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              La Plataforma Definitiva para
              <span className="block bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Batallas de Freestyle
              </span>
            </h1>
            <p className="mt-6 text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto">
              Compite en tiempo real, conecta con MCs de todo el mundo y demuestra tus habilidades en la arena digital del rap freestyle.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-xl shadow-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all"
              >
                Comenzar Ahora
              </Link>
              <a
                href="#features"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all"
              >
                Ver Más
              </a>
            </div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            ¿Por qué elegir Heyters?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-2xl font-bold text-white mb-3">Video en Tiempo Real</h3>
              <p className="text-gray-300">
                Batallas con video y audio de alta calidad usando tecnología LiveKit. Siente la adrenalina como si estuvieras cara a cara.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-3">Batallas Instantáneas</h3>
              <p className="text-gray-300">
                Crea o únete a batallas en segundos. Modos 1v1, 2v2 y Open Mic. Rounds cronometrados y sistema de votación en vivo.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-3">Rankings y Logros</h3>
              <p className="text-gray-300">
                Sube en el ranking, desbloquea logros y conviértete en leyenda. Sistema de puntuación justo y transparente.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-2xl font-bold text-white mb-3">Beats Profesionales</h3>
              <p className="text-gray-300">
                Biblioteca de beats de diferentes estilos y BPM. Selecciona el beat perfecto para cada round.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-white mb-3">Comunidad Global</h3>
              <p className="text-gray-300">
                Conecta con MCs de todo el mundo. Múltiples idiomas soportados: Español, Inglés, Francés y más.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-white mb-3">Seguro y Privado</h3>
              <p className="text-gray-300">
                Batallas públicas o privadas. Moderación activa y sistema de reportes. Tu seguridad es nuestra prioridad.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-12">
            Elige tu Rol
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* MC Role */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 backdrop-blur-md p-8 rounded-2xl border-2 border-purple-500/30 hover:border-purple-400 transition-all transform hover:scale-105">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-2xl font-bold text-white mb-3">MC / Rapero</h3>
              <p className="text-gray-300 mb-4">
                Compite en batallas, sube de ranking, gana respeto y conviértete en leyenda del freestyle.
              </p>
              <ul className="text-gray-400 space-y-2">
                <li>✓ Participa en batallas 1v1, 2v2</li>
                <li>✓ Sistema de ranking y ELO</li>
                <li>✓ Estadísticas detalladas</li>
                <li>✓ Logros desbloqueables</li>
              </ul>
            </div>

            {/* Moderator Role */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-md p-8 rounded-2xl border-2 border-blue-500/30 hover:border-blue-400 transition-all transform hover:scale-105">
              <div className="text-5xl mb-4">👨‍⚖️</div>
              <h3 className="text-2xl font-bold text-white mb-3">Moderador</h3>
              <p className="text-gray-300 mb-4">
                Organiza y modera batallas, controla el flow y asegura batallas justas.
              </p>
              <ul className="text-gray-400 space-y-2">
                <li>✓ Crea y gestiona batallas</li>
                <li>✓ Control de rounds y turnos</li>
                <li>✓ Selección de beats</li>
                <li>✓ Herramientas de moderación</li>
              </ul>
            </div>

            {/* Viewer Role */}
            <div className="bg-gradient-to-br from-pink-600/20 to-pink-900/20 backdrop-blur-md p-8 rounded-2xl border-2 border-pink-500/30 hover:border-pink-400 transition-all transform hover:scale-105">
              <div className="text-5xl mb-4">👀</div>
              <h3 className="text-2xl font-bold text-white mb-3">Espectador</h3>
              <p className="text-gray-300 mb-4">
                Disfruta las batallas, vota por tus favoritos y sé parte de la comunidad.
              </p>
              <ul className="text-gray-400 space-y-2">
                <li>✓ Acceso a batallas públicas</li>
                <li>✓ Sistema de votación</li>
                <li>✓ Chat en vivo</li>
                <li>✓ Sin compromiso, solo diversión</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            ¿Listo para dominar el micrófono?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Únete a cientos de MCs que ya están compitiendo en Heyters
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 bg-white text-purple-900 text-xl font-bold rounded-xl shadow-2xl hover:bg-gray-100 transform hover:scale-105 transition-all"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © 2025 Heyters. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
