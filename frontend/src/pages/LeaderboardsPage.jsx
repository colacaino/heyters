// pages/LeaderboardsPage.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "../api/axios";
import Layout from "../components/Layout";
import { Card, Badge, LoadingSpinner, EmptyState } from "../components/ui";
import { motion } from "framer-motion";

export default function LeaderboardsPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState("all"); // all, month, week

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadLeaderboard();
  }, [user, navigate, timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Cargar leaderboard desde el backend
      const response = await axios.get(`/leaderboard?timeframe=${timeframe}&limit=50`);
      const data = response.data?.data?.leaderboard || [];

      // Verificar si el usuario actual esta en el top 50
      const userInList = data.find(p => p.id === user.id);

      if (!userInList && user) {
        // Si no esta en el top 50, obtener su posicion
        try {
          const userRankResponse = await axios.get(`/leaderboard/user/${user.id}`);
          const userRank = userRankResponse.data?.data;
          if (userRank && userRank.totalBattles > 0) {
            data.push({
              ...userRank,
              avatar: userRank.avatarUrl
            });
          }
        } catch {
          // Si el usuario no tiene batallas, agregar con datos basicos
          data.push({
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.display_name,
            wins: 0,
            losses: 0,
            points: 0,
            rank: "-",
            avatar: user.avatarUrl
          });
        }
      }

      setLeaderboard(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Error al cargar el ranking");
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-2">
              🏆 Clasificación Global
            </h1>
            <p className="text-gray-400">
              Los mejores MCs de la plataforma
            </p>
          </div>

          {/* Filtros de tiempo */}
          <Card className="p-4 mb-6">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setTimeframe("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeframe === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Todo el tiempo
              </button>
              <button
                onClick={() => setTimeframe("month")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeframe === "month"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Este mes
              </button>
              <button
                onClick={() => setTimeframe("week")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  timeframe === "week"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                Esta semana
              </button>
            </div>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="xl" />
            </div>
          )}

          {/* Leaderboard */}
          {!loading && leaderboard.length === 0 && (
            <EmptyState
              icon="🏆"
              title="No hay datos disponibles"
              description="Aún no hay suficientes batallas para generar un ranking"
            />
          )}

          {!loading && leaderboard.length > 0 && (
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`p-6 ${
                      player.username === user.username
                        ? "border-purple-500 border-2"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      {/* Ranking */}
                      <div className="text-3xl font-black w-16 text-center">
                        {getMedalIcon(player.rank)}
                      </div>

                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                        {player.avatarUrl || player.avatar ? (
                          <img
                            src={player.avatarUrl || player.avatar}
                            alt={player.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (player.displayName || "?").charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-white">
                            {player.displayName}
                          </h3>
                          {player.username === user.username && (
                            <Badge variant="primary" size="sm">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          @{player.username}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-2xl font-bold text-emerald-400">
                            {player.wins}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Victorias
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-400">
                            {player.losses}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Derrotas
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-400">
                            {player.points}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Puntos
                          </div>
                        </div>
                      </div>

                      {/* Win Rate */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {player.winRate !== undefined
                            ? `${player.winRate}%`
                            : player.wins + player.losses > 0
                              ? `${((player.wins / (player.wins + player.losses)) * 100).toFixed(0)}%`
                              : "0%"
                          }
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          Win Rate
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
