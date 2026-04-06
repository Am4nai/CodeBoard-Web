import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/axiosInstance";
import type { AuthContextType, User } from "../types/interfaces";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_USER_KEY = "user";
const LS_TOKEN_KEY = "token";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedUser = localStorage.getItem(LS_USER_KEY);
      if (!storedUser) return;

      const parsed = JSON.parse(storedUser) as User;
      if (parsed && typeof parsed === "object" && typeof parsed.id === "string") {
        setUser(parsed);
      } else {
        localStorage.removeItem(LS_USER_KEY);
      }
    } catch {
      localStorage.removeItem(LS_USER_KEY);
    }
  }, []);

  const login: AuthContextType["login"] = async (emailOrUsername, password) => {
    const res = await api.post("/auth/login", { emailOrUsername, password });

    const data = res.data as { user: User; token: string };
    const nextUser = data.user;
    const token = data.token;

    if (typeof window !== "undefined") {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(nextUser));
      localStorage.setItem(LS_TOKEN_KEY, token);
    }

    setUser(nextUser);
  };

  const register: AuthContextType["register"] = async (username, email, password) => {
    const res = await api.post("/auth/register", { username, email, password });

    const data = res.data as { user: User; token: string };
    const nextUser = data.user;
    const token = data.token;

    if (typeof window !== "undefined") {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(nextUser));
      localStorage.setItem(LS_TOKEN_KEY, token);
    }

    setUser(nextUser);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_TOKEN_KEY);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
