// src/pages/Login.jsx
import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { Input, Button } from "../components/ui";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (login) {
        await login(identifier, password);
        toast.success("¡Bienvenido de vuelta! 🎉");
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
            >
              🎤 HEYTERS
            </motion.div>
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-white">Bienvenido de Vuelta</h2>
          <p className="mt-2 text-gray-300">Inicia sesión para continuar</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username o Email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu_username o tu@email.com"
              required
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                fullWidth
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-300">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">
              Regístrate
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Volver al Inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
