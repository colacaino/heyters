// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "../api/axios";
import { Input, Button } from "../components/ui";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validar requisitos de contraseña
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!isPasswordValid) {
      toast.error("La contraseña no cumple con los requisitos");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        toast.success("¡Registro exitoso! Ya puedes iniciar sesión 🎉");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
            >
              🔥 HEYTERS
            </motion.div>
          </Link>
          <h2 className="mt-4 text-3xl font-bold text-white">Crea tu Cuenta</h2>
          <p className="mt-2 text-gray-300">Únete a la comunidad de freestyle</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="tu_username"
              required
              fullWidth
              helperText="Entre 3 y 30 caracteres, solo letras, números, _ y -"
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              fullWidth
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Contraseña"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Contraseña segura"
                required
                fullWidth
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              <Input
                label="Confirmar"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                required
                fullWidth
                error={
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                    ? "No coinciden"
                    : undefined
                }
              />
            </div>

            {/* Requisitos de contraseña */}
            {formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white/5 rounded-lg p-4 space-y-2"
              >
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                  Requisitos de contraseña:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <PasswordCheck
                    passed={passwordChecks.length}
                    label="Mínimo 8 caracteres"
                  />
                  <PasswordCheck
                    passed={passwordChecks.uppercase}
                    label="Una mayúscula"
                  />
                  <PasswordCheck
                    passed={passwordChecks.lowercase}
                    label="Una minúscula"
                  />
                  <PasswordCheck
                    passed={passwordChecks.number}
                    label="Un número"
                  />
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              disabled={!isPasswordValid || formData.password !== formData.confirmPassword}
            >
              Crear Cuenta
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-300">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
              Inicia sesión
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

// Componente para mostrar checks de contraseña
function PasswordCheck({ passed, label }) {
  return (
    <div className={`flex items-center gap-2 ${passed ? "text-emerald-400" : "text-gray-500"}`}>
      {passed ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span className="text-xs">{label}</span>
    </div>
  );
}
