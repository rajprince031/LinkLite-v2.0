import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, attachToken } from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  USER: "linklite_user_auth",
  ADMIN: "linklite_admin_auth",
};

const readStoredAuth = () => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  const admin = localStorage.getItem(STORAGE_KEYS.ADMIN);
  return {
    user: user ? JSON.parse(user) : null,
    admin: admin ? JSON.parse(admin) : null,
  };
};

export const AuthProvider = ({ children }) => {
  const [{ user, admin }, setAuthState] = useState(readStoredAuth);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    if (admin) {
      localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN);
    }
  }, [user, admin]);

  const refreshProfile = async (role) => {
    const auth = role === "ADMIN" ? admin : user;
    if (!auth?.token) {
      return null;
    }
    const response = await api.get("/auth/me", attachToken(auth.token));
    const updated = { ...auth, profile: response.data };
    setAuthState((current) => ({
      ...current,
      [role === "ADMIN" ? "admin" : "user"]: updated,
    }));
    return updated;
  };

  const login = (role, payload) => {
    setAuthState((current) => ({
      ...current,
      [role === "ADMIN" ? "admin" : "user"]: payload,
    }));
  };

  const logout = (role) => {
    setAuthState((current) => ({
      ...current,
      [role === "ADMIN" ? "admin" : "user"]: null,
    }));
  };

  const value = useMemo(
    () => ({
      user,
      admin,
      login,
      logout,
      refreshProfile,
    }),
    [user, admin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
