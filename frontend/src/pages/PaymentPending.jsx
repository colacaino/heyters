// pages/PaymentPending.jsx
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { motion } from "framer-motion";

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get("payment_id");

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-12 max-w-md text-center">
            <div className="text-6xl mb-6 animate-pulse">⏳</div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">
              Pago Pendiente
            </h1>
            <p className="text-gray-400 mb-8">
              Tu pago está siendo procesado. Esto puede tomar unos minutos si
              elegiste pagar en efectivo o por transferencia.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
              <p className="text-sm text-yellow-300">
                Te notificaremos por email cuando el pago sea confirmado.
                Tu cuenta será actualizada automáticamente.
              </p>
            </div>

            {paymentId && (
              <p className="text-xs text-gray-500 mb-4">
                ID de pago: {paymentId}
              </p>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate("/")}
              >
                Volver al Inicio
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
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
