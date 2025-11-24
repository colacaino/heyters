// pages/PaymentFailure.jsx
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { Card, Button } from "../components/ui";
import { motion } from "framer-motion";

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
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
            <div className="text-6xl mb-6">😔</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Pago no completado
            </h1>
            <p className="text-gray-400 mb-8">
              El pago no pudo ser procesado. Esto puede deberse a fondos
              insuficientes, tarjeta rechazada u otro problema.
            </p>

            {status && (
              <p className="text-sm text-gray-500 mb-4">
                Estado: {status}
              </p>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate("/payment")}
              >
                Intentar de nuevo
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => navigate("/")}
              >
                Volver al Inicio
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
