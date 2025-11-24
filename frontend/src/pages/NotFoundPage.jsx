// pages/NotFoundPage.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* 404 Grande */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8"
        >
          <h1 className="text-9xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        {/* Emoji animado */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          className="text-6xl mb-6"
        >
          🎤
        </motion.div>

        {/* Texto */}
        <h2 className="text-3xl font-bold text-white mb-4">
          ¡Esta batalla no existe!
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Parece que te perdiste en el camino. La página que buscas no está disponible
          o fue eliminada.
        </p>

        {/* Botones */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/home">
            <Button variant="primary" size="lg">
              🏠 Volver al Home
            </Button>
          </Link>
          <Link to="/create-battle">
            <Button variant="outline" size="lg">
              ⚔️ Crear Batalla
            </Button>
          </Link>
        </div>

        {/* Decoración */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="mt-16 text-sm text-gray-600"
        >
          <p>¿Necesitas ayuda? Contacta al soporte</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
