import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "../config/axios";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado");
      return;
    }

    // Verificar el token
    const verifyToken = async () => {
      try {
        const response = await axios.get(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(response.data.message || "Email verificado exitosamente");
        toast.success("¡Email verificado! Ya puedes usar todas las funciones.");

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Error al verificar el email. El token puede haber expirado."
        );
        toast.error("Error al verificar el email");
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-purple-500/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Heyters
          </h1>
          <p className="text-gray-400">Verificación de email</p>
        </div>

        {/* Loading State */}
        {status === "loading" && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-300">Verificando tu email...</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center py-8">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Email Verificado!
            </h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <p className="text-sm text-gray-400 mb-4">
              Serás redirigido al login en unos segundos...
            </p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Ir al Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center py-8">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Error de Verificación
            </h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Ir al Login
              </Link>
              <p className="text-sm text-gray-400">
                ¿Necesitas un nuevo link?{" "}
                <Link to="/login" className="text-purple-400 hover:underline">
                  Inicia sesión y solicita reenvío
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
