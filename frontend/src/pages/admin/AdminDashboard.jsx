// pages/admin/AdminDashboard.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import { Card, Badge, LoadingSpinner, Button } from "../../components/ui";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

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
    loadDashboard();
  }, [user, navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/dashboard");
      setDashboard(res.data.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDFReport = async () => {
    try {
      toast.loading("Generando informe PDF...");
      const response = await axios.get("/admin/report/pdf", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Heyters_Informe_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("Informe PDF descargado exitosamente");
    } catch (error) {
      toast.dismiss();
      console.error("❌ Error descargando PDF:", error);

      // Mostrar información detallada del error
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
        toast.error(`Error ${error.response.status}: ${error.response.data?.message || 'Error al generar el PDF'}`);
      } else if (error.request) {
        console.error("No se recibió respuesta del servidor:", error.request);
        toast.error("No se pudo conectar con el servidor");
      } else {
        console.error("Error al configurar la petición:", error.message);
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const stats = dashboard?.stats || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              🛡️ Panel de Administración
            </h1>
            <p className="text-gray-400">
              Bienvenido, {user?.displayName || user?.username}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/users">
              <Button variant="primary">👥 Gestionar Usuarios</Button>
            </Link>
            <Link to="/admin/payments">
              <Button variant="primary">💰 Suscripciones</Button>
            </Link>
            <Link to="/admin/event-requests">
              <Button variant="secondary">Eventos especiales</Button>
            </Link>
            <Link to="/home">
              <Button variant="secondary">← Volver al Home</Button>
            </Link>
          </div>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Usuarios"
            value={stats.totalUsers}
            icon="👥"
            color="purple"
          />
          <StatCard
            title="Usuarios Pro"
            value={stats.proUsers}
            icon="⭐"
            color="yellow"
            subtitle={`${stats.conversionRate}% conversión`}
          />
          <StatCard
            title="Nuevos Hoy"
            value={stats.newToday}
            icon="📈"
            color="green"
          />
          <StatCard
            title="Total Batallas"
            value={stats.totalBattles}
            icon="⚔️"
            color="red"
            subtitle={`${stats.activeBattles} activas`}
          />
        </div>

        {/* Segunda fila de stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Usuarios Básicos"
            value={stats.basicUsers}
            icon="👤"
            color="gray"
          />
          <StatCard
            title="Nuevos (7 días)"
            value={stats.newWeek}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Batallas Hoy"
            value={stats.battlesToday}
            icon="🎯"
            color="pink"
          />
          <StatCard
            title="Tasa Conversión"
            value={`${stats.conversionRate}%`}
            icon="💰"
            color="emerald"
          />
        </div>

        {/* Contenido principal */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Usuarios recientes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Usuarios Recientes</h2>
              <Link to="/admin/users">
                <Button variant="ghost" size="sm">Ver todos →</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard?.recentUsers?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
                      {u.displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {u.displayName || u.username}
                      </p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <Badge variant={u.isPro ? "success" : "secondary"} size="sm">
                    {u.isPro ? "Pro" : "Básico"}
                  </Badge>
                </div>
              ))}
              {(!dashboard?.recentUsers || dashboard.recentUsers.length === 0) && (
                <p className="text-gray-500 text-center py-4">No hay usuarios</p>
              )}
            </div>
          </Card>

          {/* Batallas recientes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Batallas Recientes</h2>
              <Link to="/home">
                <Button variant="ghost" size="sm">Ver todas →</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard?.recentBattles?.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{b.title}</p>
                    <p className="text-xs text-gray-400">por {b.creator}</p>
                  </div>
                  <Badge
                    variant={
                      b.status === "live"
                        ? "success"
                        : b.status === "finished"
                        ? "secondary"
                        : "warning"
                    }
                    size="sm"
                  >
                    {b.status === "live" ? "En vivo" : b.status === "finished" ? "Terminada" : "Pendiente"}
                  </Badge>
                </div>
              ))}
              {(!dashboard?.recentBattles || dashboard.recentBattles.length === 0) && (
                <p className="text-gray-500 text-center py-4">No hay batallas</p>
              )}
            </div>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link to="/admin/users">
              <Button variant="outline" fullWidth className="h-20 flex-col gap-2">
                <span className="text-2xl">👥</span>
                <span>Gestionar Usuarios</span>
              </Button>
            </Link>
            <Link to="/create-battle">
              <Button variant="outline" fullWidth className="h-20 flex-col gap-2">
                <span className="text-2xl">⚔️</span>
                <span>Crear Batalla</span>
              </Button>
            </Link>
            <Link to="/payment">
              <Button variant="outline" fullWidth className="h-20 flex-col gap-2">
                <span className="text-2xl">💰</span>
                <span>Ver Planes</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              fullWidth
              className="h-20 flex-col gap-2"
              onClick={downloadPDFReport}
            >
              <span className="text-2xl">📄</span>
              <span>Descargar Informe</span>
            </Button>
            <Button
              variant="outline"
              fullWidth
              className="h-20 flex-col gap-2"
              onClick={loadDashboard}
            >
              <span className="text-2xl">🔄</span>
              <span>Actualizar</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/30",
    yellow: "from-yellow-600/20 to-yellow-600/5 border-yellow-500/30",
    green: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/30",
    red: "from-red-600/20 to-red-600/5 border-red-500/30",
    blue: "from-blue-600/20 to-blue-600/5 border-blue-500/30",
    pink: "from-pink-600/20 to-pink-600/5 border-pink-500/30",
    gray: "from-gray-600/20 to-gray-600/5 border-gray-500/30",
    emerald: "from-emerald-600/20 to-emerald-600/5 border-emerald-500/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-black text-white">{value ?? 0}</p>
      <p className="text-sm text-gray-400">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}
