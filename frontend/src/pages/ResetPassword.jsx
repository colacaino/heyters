import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "../config/axios";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!password || !confirmPassword) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!token) {
      toast.error("Token de recuperación no encontrado");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`/auth/reset-password/${token}`, {
        password,
      });

      toast.success(response.data.message || "Contraseña actualizada exitosamente");

      // Redirigir al login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Error al restablecer la contraseña. El token puede haber expirado."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-purple-500/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Token No Encontrado
            </h2>
            <p className="text-gray-300 mb-6">
              El enlace de recuperación no es válido o ha expirado.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Solicitar nuevo enlace
            </Link>
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
            Restablecer Contraseña
          </h2>
          <p className="text-gray-400">Ingresa tu nueva contraseña</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-12"
                disabled={loading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Usa al menos 6 caracteres
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`flex-1 h-1 rounded ${
                    password.length >= 6 ? "bg-green-500" : "bg-gray-600"
                  }`}
                ></div>
                <div
                  className={`flex-1 h-1 rounded ${
                    password.length >= 8 ? "bg-green-500" : "bg-gray-600"
                  }`}
                ></div>
                <div
                  className={`flex-1 h-1 rounded ${
                    password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                ></div>
              </div>
              <p className="text-xs text-gray-400">
                {password.length < 6 && "Demasiado corta"}
                {password.length >= 6 && password.length < 8 && "Contraseña débil"}
                {password.length >= 8 && password.length < 10 && "Contraseña media"}
                {password.length >= 10 &&
                  /[A-Z]/.test(password) &&
                  /[0-9]/.test(password) &&
                  "Contraseña fuerte"}
              </p>
            </div>
          )}

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
                Actualizando...
              </>
            ) : (
              "Restablecer contraseña"
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
