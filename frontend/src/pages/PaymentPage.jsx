// pages/PaymentPage.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { Card, Button, Badge } from "../components/ui";
import { motion } from "framer-motion";

export default function PaymentPage() {
  const { user, isPro, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const plans = [
    {
      id: "basic",
      name: "Plan Básico",
      code: null,
      price: 0,
      currency: "CLP",
      period: "mes",
      features: [
        { text: "Ver resúmenes de batallas", included: true },
        { text: "Explorar la comunidad", included: true },
        { text: "Ver perfiles de MCs", included: true },
        { text: "Ver rankings", included: true },
        { text: "Participar en batallas", included: false },
        { text: "Votar en batallas en vivo", included: false },
        { text: "Chat en tiempo real", included: false },
        { text: "Crear batallas", included: false },
      ],
      recommended: false,
      current: !isPro,
    },
    {
      id: "pro-trial",
      name: "Pro Trial",
      code: "pro_trial_10d",
      price: 2000,
      currency: "CLP",
      period: "10 días",
      features: [
        { text: "Todo lo del plan Pro", included: true },
        { text: "⚡ Perfecto para probar", included: true },
        { text: "Ver batallas en vivo completas", included: true },
        { text: "Participar como MC", included: true },
        { text: "Votar en batallas", included: true },
        { text: "Chat en tiempo real", included: true },
        { text: "Crear batallas propias", included: true },
        { text: "✅ Pago único - No renovación", included: true },
      ],
      recommended: true,
      current: false,
      badge: "PRUEBA",
    },
    {
      id: "pro",
      name: "Plan Pro",
      code: "pro_monthly",
      price: 5000,
      currency: "CLP",
      period: "mes",
      features: [
        { text: "Todo lo del plan Básico", included: true },
        { text: "Ver batallas en vivo completas", included: true },
        { text: "Participar como MC", included: true },
        { text: "Votar en batallas", included: true },
        { text: "Chat en tiempo real", included: true },
        { text: "Crear batallas propias", included: true },
        { text: "Estadísticas avanzadas", included: true },
        { text: "Badges y logros especiales", included: true },
      ],
      recommended: false,
      current: isPro,
    },
  ];

  const handleSubscribe = async (plan) => {
    if (plan.price === 0) {
      toast("Ya tienes acceso al plan Básico", { icon: "ℹ️" });
      return;
    }

    if (!plan.code) {
      toast.error("Plan inválido");
      return;
    }

    if (isPro && plan.code !== "pro_trial_10d") {
      toast.success("Ya eres usuario Pro");
      return;
    }

    try {
      setProcessing(true);
      toast.loading("Preparando pago...", { id: "payment" });

      // Importar axios dinámicamente para evitar problemas de import circular
      const axios = (await import("../api/axios")).default;

      // Crear preferencia de pago en MercadoPago
      const response = await axios.post("/payments/checkout", {
        planCode: plan.code, // Usar el código del plan seleccionado
      });

      toast.dismiss("payment");

      if (response.data.success && response.data.data) {
        const { initPoint, sandboxInitPoint } = response.data.data;

        // En desarrollo usar sandbox, en producción usar initPoint
        const paymentUrl = import.meta.env.VITE_ENV === "production"
          ? initPoint
          : (sandboxInitPoint || initPoint);

        // Redirigir a MercadoPago
        toast.success("Redirigiendo a MercadoPago...");
        window.location.href = paymentUrl;
      } else {
        toast.error(response.data.message || "Error al crear el pago");
      }

    } catch (error) {
      toast.dismiss("payment");
      const errorMsg = error.response?.data?.message || "Error al procesar el pago";
      toast.error(errorMsg);
      console.error("Payment error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white mb-4">
              Elige tu{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Plan
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Desbloquea todo el potencial de Heyters con el Plan Pro.
              Participa en batallas, vota y conecta con la comunidad.
            </p>
          </div>

          {/* Planes */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-8 h-full flex flex-col relative ${
                    plan.recommended ? "border-2 border-purple-500 shadow-lg shadow-purple-500/20" : ""
                  }`}
                >
                  {/* Badge de recomendado */}
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="primary" size="md">
                        Recomendado
                      </Badge>
                    </div>
                  )}

                  {/* Badge de plan actual */}
                  {plan.current && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="success" size="sm">
                        Tu Plan
                      </Badge>
                    </div>
                  )}

                  {/* Nombre del plan */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>

                  {/* Precio */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-4xl font-black text-emerald-400">
                        GRATIS
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-gray-400">/ {plan.period}</span>
                      </div>
                    )}
                    {plan.price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Aproximadamente ${(plan.price / 1000).toFixed(0)} USD
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className={`text-sm flex items-start gap-2 ${
                          feature.included ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {feature.included ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Botón */}
                  <Button
                    variant={plan.recommended ? "primary" : "outline"}
                    size="lg"
                    fullWidth
                    onClick={() => handleSubscribe(plan)}
                    disabled={plan.current || processing}
                  >
                    {plan.current
                      ? "Tu Plan Actual"
                      : plan.price === 0
                      ? "Plan Gratuito"
                      : processing
                      ? "Procesando..."
                      : "Obtener Pro"}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Beneficios Pro */}
          <Card className="p-8 mb-8 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              ¿Por qué ser Pro?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎤</div>
                <h3 className="font-bold text-white mb-2">Participa en Batallas</h3>
                <p className="text-sm text-gray-400">
                  Demuestra tu talento compitiendo contra otros MCs en batallas en vivo.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🗳️</div>
                <h3 className="font-bold text-white mb-2">Vota y Decide</h3>
                <p className="text-sm text-gray-400">
                  Tu voto cuenta. Decide quién gana las batallas más épicas.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="font-bold text-white mb-2">Conecta en Vivo</h3>
                <p className="text-sm text-gray-400">
                  Chat en tiempo real con la comunidad durante las batallas.
                </p>
              </div>
            </div>
          </Card>

          {/* FAQ */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Preguntas Frecuentes
            </h2>

            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                  ¿Cómo puedo pagar?
                </summary>
                <p className="mt-2 text-gray-400 ml-4">
                  Aceptamos pagos con tarjeta de crédito y débito. Próximamente habilitaremos
                  transferencia bancaria y otros métodos de pago chilenos.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                  ¿Puedo cancelar cuando quiera?
                </summary>
                <p className="mt-2 text-gray-400 ml-4">
                  Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil.
                  Mantendrás acceso hasta el final del periodo pagado.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                  ¿Qué pasa si ya pagué y no funciona algo?
                </summary>
                <p className="mt-2 text-gray-400 ml-4">
                  Contáctanos y resolveremos el problema inmediatamente. Si no quedas satisfecho,
                  te devolvemos el dinero.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                  ¿Hay descuentos?
                </summary>
                <p className="mt-2 text-gray-400 ml-4">
                  Próximamente ofreceremos planes anuales con descuento y promociones especiales.
                  ¡Síguenos en redes para enterarte!
                </p>
              </details>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
