// pages/PaymentSuccess.jsx
import { useEffect, useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const { refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // MercadoPago envía estos parámetros en la URL
        const paymentId = searchParams.get("payment_id");
        const status = searchParams.get("status");
        const externalReference = searchParams.get("external_reference");

        console.log("Payment callback:", { paymentId, status, externalReference });

        if (status === "approved") {
          // Refrescar datos del usuario para obtener el nuevo estado Pro
          await refreshUser();
          toast.success("¡Pago exitoso! Ya eres usuario Pro");
        }
      } catch (error) {
        console.error("Error verificando pago:", error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, refreshUser]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-12 max-w-md text-center">
            {loading ? (
              <>
                <div className="text-6xl mb-6 animate-pulse">⏳</div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Verificando pago...
                </h1>
                <p className="text-gray-400">
                  Espera un momento mientras confirmamos tu pago.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">🎉</div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  ¡Pago Exitoso!
                </h1>
                <p className="text-gray-400 mb-8">
                  Tu cuenta ha sido actualizada a Pro. Ya puedes disfrutar de todos
                  los beneficios exclusivos.
                </p>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate("/")}
                  >
                    Ir al Inicio
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => navigate("/profile")}
                  >
                    Ver mi Perfil
                  </Button>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
