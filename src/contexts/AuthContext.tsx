"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { userRepository } from "@/lib/services";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  loginAsDemo: (demoEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_KEY = "infiplus_current_user_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Auto-login default demo user for frictionless review if no session exists
        userRepository.findByEmail("alex@infiplus.in").then(demoUser => {
          if (demoUser) {
            const { passwordHash: _, ...safeUser } = demoUser;
            setUser(safeUser);
            localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
          }
        });
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const found = await userRepository.findByEmail(email);
      if (!found) {
        return { success: false, error: "No account found with this email address." };
      }
      if (password && found.passwordHash && found.passwordHash !== password) {
        return { success: false, error: "Incorrect password. Please try again." };
      }
      const { passwordHash: _, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const existing = await userRepository.findByEmail(email);
      if (existing) {
        return { success: false, error: "An account with this email already exists." };
      }
      const created = await userRepository.create({
        name,
        email,
        passwordHash: password || "demo123",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        company: "Infiplus Workspace",
      });
      setUser(created);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(created));
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message || "Registration failed" };
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
    const updated = await userRepository.update(user.id, updates);
    setUser(updated);
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(updated));
    return updated;
  };

  const loginAsDemo = async (demoEmail: string = "alex@infiplus.in") => {
    const demo = await userRepository.findByEmail(demoEmail);
    if (demo) {
      const { passwordHash: _, ...safeUser } = demo;
      setUser(safeUser);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        loginAsDemo,
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
