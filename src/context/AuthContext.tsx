import React, { createContext, useContext, useEffect, useState } from "react";

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

  const checkSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          return;
        }
        throw new Error('Session check failed');
      }

      const data = await res.json();
      if (data?.user?.username) {
        setUser(data.user.username);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = (username: string) => {
    setUser(username);
  };

  const logout = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        username: user,
        isAuthenticated: !!user,
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
