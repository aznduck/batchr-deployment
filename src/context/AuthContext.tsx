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

  useEffect(() => {
    fetch("http://localhost:5001/api/auth/session", {
      credentials: "include",
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user?.username) {
          setUser(data.user.username);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = (username: string) => {
    setUser(username);
  };

  const logout = () => {
    fetch("http://localhost:5001/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      setUser(null);
    });
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
