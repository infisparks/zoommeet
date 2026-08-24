"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_KEY = "zoomeet_firebase_auth_user_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!password) {
        return { success: false, error: "Password is required" };
      }

      const res = await api.login(email, password);

      if (res.success && res.user) {
        const authUser: User = {
          id: res.user.id,
          name: res.user.name || "User",
          email: res.user.email,
          role: (res.user.role as "admin" | "host" | "user") || "host",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(res.user.name || email)}`,
          company: "First Option Agency",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setUser(authUser);
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(authUser));
        return { success: true };
      }

      return { success: false, error: res.error || "Authentication failed" };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(ACTIVE_USER_KEY);
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    if (!user) throw new Error("No active user");
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(updated);
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
