// pages/admin/AdminPayments.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import { Card, Badge, LoadingSpinner, Button } from "../../components/ui";
import { motion } from "framer-motion";

export default function AdminPayments() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subscriptions"); // subscriptions, payments, stats
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!user.isAdmin && user.role !== "admin") {
      toast.error("Acceso denegado - Solo administradores");
      navigate("/home");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, paymentsRes, statsRes] = await Promise.all([
        axios.get("/payments/admin/subscriptions"),
        axios.get("/payments/admin/payments"),
        axios.get("/payments/admin/stats"),
      ]);

      setSubscriptions(subsRes.data.data.subscriptions || []);
      setPayments(paymentsRes.data.data.payments || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast.error("Error al cargar datos de pagos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDaysRemaining = (days) => {
    if (!days || days < 0) return "Expirado";
    if (days < 1) return "Menos de 1 día";
    return `${Math.floor(days)} días`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              💰 Gestión de Pagos y Suscripciones
            </h1>
            <p className="text-gray-400">
              Monitorea ingresos, suscripciones activas y pagos recientes
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin">
              <Button variant="secondary">← Volver al Panel</Button>
            </Link>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Ingresos Totales"
            value={formatPrice(stats.totalRevenueCents || 0)}
            icon="💵"
            color="green"
          />
          <StatCard
            title="Pagos Exitosos"
            value={stats.totalPayments || 0}
            icon="✅"
            color="blue"
          />
          <StatCard
            title="Suscripciones Activas"
            value={stats.activeSubscriptions || 0}
            icon="⭐"
            color="yellow"
          />
          <StatCard
            title="Usuarios Pagantes"
            value={stats.uniquePayingUsers || 0}
            icon="👥"
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === "subscriptions"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Suscripciones Activas
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === "payments"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Historial de Pagos
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === "stats"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Estadísticas
          </button>
        </div>

        {/* Contenido de tabs */}
        {activeTab === "subscriptions" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Inicio
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Tiempo Restante
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No hay suscripciones activas
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-medium">{sub.display_name || sub.username}</p>
                            <p className="text-sm text-gray-400">{sub.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{sub.plan_name}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={sub.status === "active" ? "success" : "default"}
                            size="sm"
                          >
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {formatDate(sub.current_period_start)}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {formatDate(sub.current_period_end)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              sub.days_remaining > 7
                                ? "success"
                                : sub.days_remaining > 3
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                          >
                            {formatDaysRemaining(sub.days_remaining)}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "payments" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      ID Transacción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No hay pagos registrados
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-medium">
                              {payment.display_name || payment.username}
                            </p>
                            <p className="text-sm text-gray-400">{payment.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-semibold">
                          {formatPrice(payment.amount_cents)}
                        </td>
                        <td className="px-4 py-3 text-gray-300 capitalize">{payment.provider}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              payment.status === "succeeded"
                                ? "success"
                                : payment.status === "pending"
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {payment.provider_payment_id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "stats" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Ingresos Mensuales</h2>
              {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                <div className="space-y-3">
                  {stats.monthlyRevenue.map((month) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-semibold">{month.month}</p>
                        <p className="text-sm text-gray-400">{month.payments} pagos</p>
                      </div>
                      <p className="text-green-400 font-bold text-lg">
                        {formatPrice(month.revenue_cents)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No hay datos de ingresos mensuales
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Resumen General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Ingreso Total Acumulado</p>
                  <p className="text-white text-2xl font-bold">
                    {formatPrice(stats.totalRevenueCents || 0)}
                  </p>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Promedio por Pago</p>
                  <p className="text-white text-2xl font-bold">
                    {stats.totalPayments > 0
                      ? formatPrice(
                          Math.round(stats.totalRevenueCents / stats.totalPayments)
                        )
                      : "$0"}
                  </p>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Tasa de Conversión</p>
                  <p className="text-white text-2xl font-bold">
                    {stats.totalPayments > 0 && stats.uniquePayingUsers > 0
                      ? `${Math.round(
                          (stats.uniquePayingUsers / stats.totalPayments) * 100
                        )}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Suscripciones Activas Ahora</p>
                  <p className="text-white text-2xl font-bold">
                    {stats.activeSubscriptions || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de estadística
function StatCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    green: "from-emerald-900/50 to-emerald-800/30 border-emerald-700/50",
    blue: "from-blue-900/50 to-blue-800/30 border-blue-700/50",
    yellow: "from-yellow-900/50 to-yellow-800/30 border-yellow-700/50",
    purple: "from-purple-900/50 to-purple-800/30 border-purple-700/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
    </motion.div>
  );
}
