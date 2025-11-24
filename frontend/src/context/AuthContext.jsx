// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import axios from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const persistSession = ({ user: nextUser, accessToken: nextToken, refreshToken }) => {
    if (nextUser) {
      setUser(nextUser);
      window.localStorage.setItem("user", JSON.stringify(nextUser));
    }
    if (nextToken) {
      setAccessToken(nextToken);
      window.localStorage.setItem("accessTokenTemp", nextToken);
    }
    if (refreshToken) {
      window.localStorage.setItem("refreshToken", refreshToken);
    }
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken(null);
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("refreshToken");
    window.localStorage.removeItem("accessTokenTemp");
  };

  const login = async (identifier, password) => {
    const res = await axios.post("/auth/login", { identifier, password });
    persistSession(res.data.data);
  };

  const logout = () => {
    clearSession();
  };

  // Refresh user data from server (useful after Pro upgrade)
  const refreshUser = async () => {
    try {
      const res = await axios.get("/auth/me");
      if (res.data?.data?.user) {
        persistSession({
          user: res.data.data.user,
          accessToken,
          refreshToken: window.localStorage.getItem("refreshToken"),
        });
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
    }
  };

  // Convenience getters for permissions
  const isPro = Boolean(user?.isPro || user?.canRap || user?.canModerate);
  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    const bootstrap = async () => {
      const storedAccess = window.localStorage.getItem("accessTokenTemp");
      const storedUser = window.localStorage.getItem("user");

      if (storedAccess) {
        setAccessToken(storedAccess);
      }
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          window.localStorage.removeItem("user");
        }
      }

      if (!storedAccess) {
        setInitializing(false);
        return;
      }

      try {
        const res = await axios.get("/auth/me");
        persistSession({
          user: res.data?.data?.user,
          accessToken: storedAccess,
          refreshToken: window.localStorage.getItem("refreshToken"),
        });
      } catch (err) {
        console.error("No se pudo recuperar la sesión", err);
        clearSession();
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      login,
      logout,
      initializing,
      refreshUser,
      isPro,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}
