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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const checkSession = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/session`, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          return;
        }
        
        // If we get a 500 error and haven't exceeded retries, try again
        if (res.status === 500 && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(checkSession, 1000 * Math.pow(2, retryCount)); // Exponential backoff
          return;
        }
        
        throw new Error('Session check failed');
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Invalid response type');
      }

      const data = await res.json();
      if (data?.user?.username) {
        setUser(data.user.username);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      
      // If we haven't exceeded retries, try again
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(checkSession, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setUser(null);
      }
    } finally {
      if (retryCount >= MAX_RETRIES) {
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
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
