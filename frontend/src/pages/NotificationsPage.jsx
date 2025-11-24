import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "../api/axios";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import Notification from "../components/Notification";

export default function NotificationsPage() {
  const { user, initializing } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initializing && !user) {
      navigate("/", { replace: true });
    }
  }, [initializing, user, navigate]);

  useEffect(() => {
    if (initializing || !user) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get("/notifications");
        setNotifications(res.data?.data?.notifications || []);
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Error cargando notificaciones");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, initializing]);

  useEffect(() => {
    if (!user) return;

    const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:4000";
    const socket = io(WS_URL);
    socket.emit("user:register", user.id);
    socket.on("notification:new", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="opacity-70">Preparando notificaciones...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout
      title="Centro de notificaciones"
      description="Aquí ves invitaciones, avisos de staff y resultados de batallas."
    >
      {loading ? (
        <p className="opacity-70">Cargando notificaciones...</p>
      ) : notifications.length === 0 ? (
        <p className="opacity-70">No tienes notificaciones aún.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <Notification
              key={notif.id}
              title={notif.title}
              message={notif.body || notif.message}
              date={notif.created_at || notif.createdAt}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
