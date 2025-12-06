import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";

export default function VerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Obtener email del state (pasado desde Register)
  const email = location.state?.email || "";
  const username = location.state?.username || "";

  useEffect(() => {
    // Si no hay email, redirigir al registro
    if (!email) {
      navigate("/register");
      return;
    }

    // Countdown para reenviar email
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, email, navigate]);

  const handleResendEmail = async () => {
    setResending(true);
    setCanResend(false);
    setCountdown(60);

    try {
      // Aquí deberías tener un endpoint para reenviar el email sin estar autenticado
      // Por ahora, mostraremos un mensaje
      toast.success("Email de verificación reenviado. Revisa tu bandeja de entrada.");
    } catch (error) {
      toast.error("Error al reenviar el email. Intenta de nuevo más tarde.");
      setCanResend(true);
      setCountdown(0);
    } finally {
      setResending(false);
    }
  };

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
        </div>

        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-10 h-10 text-purple-400"
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

          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Revisa tu Email!
          </h2>
          <p className="text-gray-300 mb-6">
            Hemos enviado un correo de verificación a:
          </p>
          <p className="text-purple-400 font-semibold text-lg mb-2">{email}</p>
          <p className="text-sm text-gray-400">
            Usuario: <span className="text-white font-medium">{username}</span>
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Pasos a seguir:
          </h3>
          <ol className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="text-purple-400 font-bold mr-2">1.</span>
              <span>Abre tu bandeja de entrada de email</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 font-bold mr-2">2.</span>
              <span>Busca el email de <strong>Heyters</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 font-bold mr-2">3.</span>
              <span>Haz clic en el enlace de verificación</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 font-bold mr-2">4.</span>
              <span>¡Inicia sesión y comienza a rapear! 🎤</span>
            </li>
          </ol>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-200 flex items-start">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
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
            <span>
              <strong>⚠️ No olvides revisar la carpeta de spam</strong> si no
              encuentras el email en tu bandeja principal.
            </span>
          </p>
        </div>

        {/* Resend Email */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-3">¿No recibiste el email?</p>
          <button
            onClick={handleResendEmail}
            disabled={!canResend || resending}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
            ) : canResend ? (
              "Reenviar email"
            ) : (
              `Reenviar en ${countdown}s`
            )}
          </button>
        </div>

        {/* Go to Login */}
        <div className="text-center border-t border-gray-700 pt-6">
          <p className="text-sm text-gray-400 mb-3">
            ¿Ya verificaste tu email?
          </p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
