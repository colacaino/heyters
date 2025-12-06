import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../config/axios";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Por favor ingresa tu email");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/auth/forgot-password", { email });
      toast.success(response.data.message);
      setSent(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Error al enviar el email de recuperación"
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-purple-500/20">
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Message */}
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Email Enviado!
            </h2>
            <p className="text-gray-300 mb-6">
              Si el email <span className="text-purple-400 font-semibold">{email}</span> está
              registrado, recibirás un enlace para restablecer tu contraseña.
            </p>

            {/* Info */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-200">
                <strong>⚠️ Importante:</strong> El enlace expira en 1 hora.
                Revisa tu bandeja de entrada y spam.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to="/login"
                className="block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
              >
                Volver al Login
              </Link>
              <button
                onClick={() => setSent(false)}
                className="block w-full text-gray-400 hover:text-white transition"
              >
                Enviar a otro email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-purple-500/20">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Heyters
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-400">
            Ingresa tu email y te enviaremos un enlace para recuperarla
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              disabled={loading}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            ¿Recordaste tu contraseña?{" "}
            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold transition"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
