// pages/admin/AdminUsers.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import { Card, Badge, LoadingSpinner, Button, Input } from "../../components/ui";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsers() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, pro, basic
  const [page, setPage] = useState(1);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    isPro: false,
  });

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
  }, [user, navigate]);

  useEffect(() => {
    loadUsers();
  }, [page, filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (search) params.append("search", search);
      if (filter === "pro") params.append("isPro", "true");
      if (filter === "basic") params.append("isPro", "false");

      const res = await axios.get(`/admin/users?${params}`);
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || {});
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await axios.post("/admin/users", formData);
      toast.success("Usuario creado exitosamente");
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al crear usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await axios.put(`/admin/users/${selectedUser.id}`, {
        displayName: formData.displayName,
        email: formData.email,
        isPro: formData.isPro,
      });
      toast.success("Usuario actualizado");
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      await axios.delete(`/admin/users/${selectedUser.id}`);
      toast.success("Usuario eliminado");
      setShowDeleteModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePro = async (userId, currentStatus) => {
    try {
      await axios.put(`/admin/users/${userId}/toggle-pro`, {
        isPro: !currentStatus,
      });
      toast.success(currentStatus ? "Cambiado a Básico" : "Actualizado a Pro");
      loadUsers();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      displayName: u.displayName || "",
      email: u.email,
      password: "",
      isPro: u.isPro,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (u) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: "",
      displayName: "",
      email: "",
      password: "",
      isPro: false,
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              👥 Gestión de Usuarios
            </h1>
            <p className="text-gray-400">
              {pagination.total || 0} usuarios registrados
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + Crear Usuario
            </Button>
            <Link to="/admin">
              <Button variant="secondary">← Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por nombre, email o username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
            </form>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "primary" : "ghost"}
                size="sm"
                onClick={() => { setFilter("all"); setPage(1); }}
              >
                Todos
              </Button>
              <Button
                variant={filter === "pro" ? "primary" : "ghost"}
                size="sm"
                onClick={() => { setFilter("pro"); setPage(1); }}
              >
                Pro
              </Button>
              <Button
                variant={filter === "basic" ? "primary" : "ghost"}
                size="sm"
                onClick={() => { setFilter("basic"); setPage(1); }}
              >
                Básico
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla de usuarios */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-300">Usuario</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-300">Email</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-300">Estado</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-300">Registro</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
                          {u.displayName?.charAt(0).toUpperCase() || u.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {u.displayName || u.username}
                          </p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{u.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={u.isPro ? "success" : "secondary"} size="sm">
                          {u.isPro ? "Pro" : "Básico"}
                        </Badge>
                        {u.isAdmin && (
                          <Badge variant="warning" size="sm">Admin</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePro(u.id, u.isPro)}
                          disabled={u.isAdmin}
                        >
                          {u.isPro ? "→ Básico" : "→ Pro"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(u)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(u)}
                          disabled={u.isAdmin}
                          className="text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No se encontraron usuarios
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-white/5">
              <p className="text-sm text-gray-400">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  ← Anterior
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Siguiente →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Crear Usuario */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)}>
            <h2 className="text-xl font-bold text-white mb-4">Crear Usuario</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <Input
                label="Nombre para mostrar"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPro}
                  onChange={(e) => setFormData({ ...formData, isPro: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-300">Usuario Pro</span>
              </label>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={actionLoading}
                >
                  {actionLoading ? "Creando..." : "Crear Usuario"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Editar Usuario */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <Modal onClose={() => setShowEditModal(false)}>
            <h2 className="text-xl font-bold text-white mb-4">
              Editar Usuario: {selectedUser.username}
            </h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <Input
                label="Nombre para mostrar"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPro}
                  onChange={(e) => setFormData({ ...formData, isPro: e.target.checked })}
                  className="w-4 h-4 rounded"
                  disabled={selectedUser.isAdmin}
                />
                <span className="text-sm text-gray-300">Usuario Pro</span>
              </label>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={actionLoading}
                >
                  {actionLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Confirmar Eliminación */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <Modal onClose={() => setShowDeleteModal(false)}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-white mb-2">
                ¿Eliminar usuario?
              </h2>
              <p className="text-gray-400 mb-6">
                Estás por eliminar a <strong>{selectedUser.displayName || selectedUser.username}</strong>.
                Esta acción desactivará la cuenta.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteUser}
                  fullWidth
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {actionLoading ? "Eliminando..." : "Sí, Eliminar"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente Modal reutilizable
function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
