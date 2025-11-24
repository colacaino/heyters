// pages/Home.jsx
import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import axios from "../api/axios";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { Card, Button, Modal, Badge, Skeleton, EmptyState, Input } from "../components/ui";

export default function Home() {
  const [battles, setBattles] = useState([]);
  const [filteredBattles, setFilteredBattles] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, waiting, ready
  const [filterVisibility, setFilterVisibility] = useState("all"); // all, public, private
  const [passwordModal, setPasswordModal] = useState({
    open: false,
    battle: null,
    role: "viewer",
    password: "",
  });
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin");
  const canRap = Boolean(user?.canRap || user?.isDemoUser);
  const canModerate = Boolean(user?.canModerate || user?.isDemoUser);

  const loadBattles = useCallback(async () => {
    try {
      const res = await axios.get("/battles");
      const payload = res.data?.data || {};
      const list = payload.data || [];
      const detailed = await Promise.all(
        list.map(async (battle) => {
          try {
            const detail = await axios.get(`/battles/${battle.id}`);
            return detail.data?.data?.battle || battle;
          } catch (err) {
            console.error("Error obteniendo batalla", battle.id, err);
            return battle;
          }
        })
      );
      setBattles(detailed);
      setFilteredBattles(detailed);
      setPagination(payload.pagination || null);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Error cargando batallas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBattles();
    const interval = setInterval(loadBattles, 8000);
    return () => clearInterval(interval);
  }, [loadBattles]);

  // Filtrar batallas cuando cambian los filtros o búsqueda
  useEffect(() => {
    let result = [...battles];

    // Filtro por búsqueda (título o descripción)
    if (searchTerm) {
      result = result.filter((battle) =>
        battle.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        battle.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (filterStatus !== "all") {
      result = result.filter((battle) => {
        const status = getStatusType(battle);
        return status === filterStatus;
      });
    }

    // Filtro por visibilidad
    if (filterVisibility !== "all") {
      result = result.filter((battle) => battle.visibility === filterVisibility);
    }

    setFilteredBattles(result);
  }, [searchTerm, filterStatus, filterVisibility, battles]);

  const joinPublic = async (battleId, role) => {
    if (!user) {
      navigate("/");
      return;
    }
    setJoining(`${battleId}-${role}`);
    try {
      await axios.post(`/battles/participant/${battleId}`, {
        role,
        slotNumber: role === "mc1" ? 1 : role === "mc2" ? 2 : null,
      });
      toast.success("¡Te has unido a la batalla!");
      navigate(`/battle/${battleId}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "No se pudo unir con ese rol");
    } finally {
      setJoining(null);
      loadBattles();
    }
  };

  const openPasswordModal = (battle, role) => {
    setPasswordModal({
      open: true,
      battle,
      role,
      password: "",
    });
  };

  const closePasswordModal = () => {
    setPasswordModal({ open: false, battle: null, role: "viewer", password: "" });
  };

  const handleRequestJoin = (battle, role) => {
    if (!user) {
      toast.error("Debes iniciar sesión para unirte");
      navigate("/login");
      return;
    }
    if ((role === "mc1" || role === "mc2") && !canRap) {
      toast.error("Necesitas ser Pro para competir como MC", {
        duration: 5000,
        icon: "⭐",
      });
      setTimeout(() => navigate("/payment"), 1500);
      return;
    }
    if (role === "moderator" && !canModerate) {
      toast.error("Necesitas ser Pro para moderar batallas", {
        duration: 5000,
        icon: "⭐",
      });
      setTimeout(() => navigate("/payment"), 1500);
    }
    if (battle.visibility === "private") {
      openPasswordModal(battle, role);
    } else {
      joinPublic(battle.id, role);
    }
  };

  const submitPrivateJoin = async () => {
    if (!passwordModal.battle) return;
    const { battle, role, password } = passwordModal;
    if (!password) {
      toast.error("Debes ingresar una contraseña");
      return;
    }
    setJoining(`${battle.id}-${role}`);
    try {
      await axios.post(`/battles/${battle.id}/join-private`, {
        password,
        role,
        slotNumber: role === "mc1" ? 1 : role === "mc2" ? 2 : null,
      });
      closePasswordModal();
      toast.success("¡Contraseña correcta! Uniéndose a la batalla...");
      navigate(`/battle/${battle.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Contraseña incorrecta");
    } finally {
      setJoining(null);
      loadBattles();
    }
  };

  const getRoleAssignments = (battle) => {
    const participants = battle.participants || [];
    const byRole = participants.reduce((acc, participant) => {
      acc[participant.role?.toLowerCase()] = participant;
      return acc;
    }, {});
    return byRole;
  };

  const getStatusLabel = (battle) => {
    const roles = getRoleAssignments(battle);
    if (!roles.moderator) return "Esperando Moderador";
    if (!roles.mc1) return "Esperando MC1";
    if (!roles.mc2) return "Esperando MC2";
    return "Listo para comenzar";
  };

  const getStatusType = (battle) => {
    const roles = getRoleAssignments(battle);
    if (roles.moderator && roles.mc1 && roles.mc2) return "ready";
    return "waiting";
  };

  const getBattleStatusBadge = (battle) => {
    const type = getStatusType(battle);
    if (type === "ready") {
      return <Badge variant="success" size="sm">Listo</Badge>;
    }
    return <Badge variant="warning" size="sm">Esperando</Badge>;
  };

  return (
    <>
      <Layout
        title="Bienvenido a Heyters"
        description="Tus batallas, tu comunidad. Usa el lobby para unirte a un combate con el rol que falte."
        rightSlot={
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate("/admin")}
              >
                🛡️ Admin
              </Button>
            )}
            {canRap ? (
              <Button
                variant="success"
                size="md"
                onClick={() => navigate("/create-battle")}
              >
                + Nueva Batalla
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/payment")}
              >
                ⭐ Hazte Pro
              </Button>
            )}
          </div>
        }
      >
        {/* Instrucciones */}
        <section className="grid gap-4 md:grid-cols-3 mb-8">
          {[
            {
              step: "Paso 1",
              title: "Crea o únete",
              description:
                "Inicia una batalla desde el botón superior o entra a una existente para espectar. Todo está sincronizado.",
              icon: "⚔️",
            },
            {
              step: "Paso 2",
              title: "Comparte el enlace",
              description:
                "Invita a MCs, moderadores y espectadores. Cada acción se transmite en tiempo real.",
              icon: "🔗",
            },
            {
              step: "Paso 3",
              title: "Modera y disfruta",
              description:
                "Usa el panel del moderador para iniciar rounds, cambiar turnos y mantener la energía a tope.",
              icon: "🎮",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 h-full">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm text-gray-300 uppercase tracking-wide">{item.step}</p>
                <h3 className="text-lg font-semibold mt-1 text-white">{item.title}</h3>
                <p className="text-sm text-gray-300 mt-2">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Filtros y búsqueda */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white">Batallas disponibles</h2>
            <Button variant="ghost" size="sm" onClick={loadBattles}>
              🔄 Actualizar
            </Button>
          </div>

          <Card className="p-4 mb-4">
            <div className="grid md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div className="md:col-span-2">
                <Input
                  placeholder="Buscar por título o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>

              {/* Filtro por estado */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos los estados</option>
                <option value="waiting">Esperando jugadores</option>
                <option value="ready">Listos para empezar</option>
              </select>

              {/* Filtro por visibilidad */}
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Públicas y privadas</option>
                <option value="public">Solo públicas</option>
                <option value="private">Solo privadas</option>
              </select>
            </div>
          </Card>
        </section>

        {/* Lista de batallas */}
        <section>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton width="200px" height="24px" />
                      <Skeleton width="80px" height="20px" />
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} height="60px" />
                      ))}
                    </div>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((k) => (
                        <Skeleton key={k} width="120px" height="36px" />
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredBattles.length === 0 ? (
            <EmptyState
              icon="⚔️"
              title={searchTerm || filterStatus !== "all" || filterVisibility !== "all"
                ? "No se encontraron batallas"
                : "Aún no hay batallas creadas"}
              description={searchTerm || filterStatus !== "all" || filterVisibility !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "¡Sé el primero en abrir una sesión épica!"}
              action={
                canRap && (
                  <Button variant="primary" size="lg" onClick={() => navigate("/create-battle")}>
                    + Crear Primera Batalla
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredBattles.map((battle, index) => {
                const roles = getRoleAssignments(battle);
                const viewerCount = (battle.participants || []).filter(
                  (p) => p.role?.toLowerCase() === "viewer"
                ).length;
                return (
                  <motion.div
                    key={battle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-5 space-y-4" hoverable>
                      {/* Header de la batalla */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {battle.visibility === "private" && (
                            <span className="text-2xl">🔒</span>
                          )}
                          <div>
                            <p className="text-lg font-semibold text-white flex items-center gap-2">
                              {battle.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs uppercase tracking-wide text-gray-400">
                                {getStatusLabel(battle)}
                              </p>
                              {getBattleStatusBadge(battle)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/battle/${battle.id}`)}
                        >
                          Ver sala →
                        </Button>
                      </div>

                      {/* Descripción */}
                      {battle.description && (
                        <p className="text-sm text-gray-400">{battle.description}</p>
                      )}

                      {/* Slots de roles */}
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <RoleCard label="MC1" participant={roles.mc1} />
                        <RoleCard label="MC2" participant={roles.mc2} />
                        <RoleCard label="Moderador" participant={roles.moderator} />
                        <RoleCard label="Espectadores" participantCount={viewerCount} />
                      </div>

                      {/* Botones de unirse */}
                      <div className="flex flex-wrap gap-3">
                        {canRap && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!roles.mc1 || joining === `${battle.id}-mc1`}
                            onClick={() => handleRequestJoin(battle, "mc1")}
                            isLoading={joining === `${battle.id}-mc1`}
                          >
                            🎤 Unirme como MC1
                          </Button>
                        )}
                        {canRap && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!roles.mc2 || joining === `${battle.id}-mc2`}
                            onClick={() => handleRequestJoin(battle, "mc2")}
                            isLoading={joining === `${battle.id}-mc2`}
                          >
                            🎤 Unirme como MC2
                          </Button>
                        )}
                        {canModerate && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!roles.moderator || joining === `${battle.id}-moderator`}
                            onClick={() => handleRequestJoin(battle, "moderator")}
                            isLoading={joining === `${battle.id}-moderator`}
                          >
                            🎮 Quiero moderar
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={joining === `${battle.id}-viewer`}
                          onClick={() => handleRequestJoin(battle, "viewer")}
                          isLoading={joining === `${battle.id}-viewer`}
                        >
                          👁️ Entrar como espectador
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {pagination && !loading && filteredBattles.length > 0 && (
            <p className="text-xs text-gray-500 mt-6 text-center">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} batallas en total)
            </p>
          )}
        </section>
      </Layout>

      {/* Modal de contraseña */}
      <Modal
        isOpen={passwordModal.open}
        onClose={closePasswordModal}
        title="Batalla privada"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Ingresa la contraseña para unirte como{" "}
            <span className="font-semibold text-white">
              {passwordModal.role.toUpperCase()}
            </span>{" "}
            en <span className="font-semibold text-white">{passwordModal.battle?.title}</span>.
          </p>
          <Input
            type="password"
            placeholder="Contraseña de la batalla"
            value={passwordModal.password}
            onChange={(e) =>
              setPasswordModal((prev) => ({ ...prev, password: e.target.value }))
            }
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                submitPrivateJoin();
              }
            }}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closePasswordModal}>
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={submitPrivateJoin}
              isLoading={joining === `${passwordModal.battle?.id}-${passwordModal.role}`}
            >
              Unirme
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function RoleCard({ label, participant, participantCount }) {
  return (
    <Card variant="glass" className="p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      {participant ? (
        <p className="text-sm font-semibold text-white">
          {participant.display_name || participant.displayName || `User ${participant.user_id}`}
        </p>
      ) : participantCount !== undefined ? (
        <p className="text-sm font-semibold text-white">{participantCount} conectados</p>
      ) : (
        <p className="text-sm text-gray-500">Libre</p>
      )}
    </Card>
  );
}
