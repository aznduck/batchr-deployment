import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: string | null;
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const checkSession = async () => {
    try {
      const data = await authApi.checkSession();
      if (data?.user?.username) {
        setUser(data.user.username);
      } else {
        setUser(null);
      }
      setLoading(false);
    } catch (error) {
      console.error("Session check error:", error);

      // If we haven't exceeded retries, try again
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setTimeout(checkSession, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = (username: string) => {
    setUser(username);
    setRetryCount(0); // Reset retry count on successful login
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setRetryCount(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        username: user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
