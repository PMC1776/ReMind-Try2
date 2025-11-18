import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { secureStorage } from "../utils/secureStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: { email: string; id: string } | null;
  login: (token: string, user: { email: string; id: string }) => Promise<void>;
  logout: () => Promise<void>;
  setNeedsVerification: (value: boolean) => void;
  needsVerification: boolean;
  setNeedsRecoveryKey: (value: boolean) => void;
  needsRecoveryKey: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [needsRecoveryKey, setNeedsRecoveryKey] = useState(false);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const storedToken = await secureStorage.getItem("authToken");
      const storedUser = await secureStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authToken: string, userData: { email: string; id: string }) => {
    try {
      await secureStorage.setItem("authToken", authToken);
      await secureStorage.setItem("user", JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to save auth state:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Remove secure items (authToken, user, encryptionKeys)
      await secureStorage.multiRemove(["authToken", "user", "encryptionKeys"]);
      // Remove non-secure items (reminders, etc.)
      await AsyncStorage.multiRemove(["reminders", "triggeredReminders", "settings"]);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setNeedsVerification(false);
      setNeedsRecoveryKey(false);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        user,
        login,
        logout,
        needsVerification,
        setNeedsVerification,
        needsRecoveryKey,
        setNeedsRecoveryKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
