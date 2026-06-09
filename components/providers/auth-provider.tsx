"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { mockAuth, mockUsers } from "@/lib/mock-data";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Check if user is stored in localStorage (mock session)
      const storedUserId = localStorage.getItem("mock_user_id");
      if (storedUserId) {
        const profile = mockUsers.find(u => u.id === storedUserId);
        setUser(profile || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signOut = async () => {
    await mockAuth.signOut();
    localStorage.removeItem("mock_user_id");
    document.cookie = "mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
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
