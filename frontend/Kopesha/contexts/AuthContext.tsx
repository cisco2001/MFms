import React, { createContext, useContext, useState, useEffect } from 'react';
import authService, { AuthService } from '../services/AuthService';
import { Alert } from 'react-native';

interface UserData {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: UserData | null;
  token: string | null;
  error: string | null;
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
  authService?: AuthService;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  authService: customAuthService,
}) => {
  const auth = customAuthService || authService;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        await auth.initialize();
        const isAuth = await auth.isAuthenticated();
        const currentUser = await auth.getCurrentUser();
        const currentToken = auth.getAccessToken();

        setIsAuthenticated(isAuth);
        setUser(currentUser);
        setToken(currentToken);
      } catch (err) {
        console.error('Error initializing auth:', err);
        Alert.alert('Error', 'Failed to initialize authentication');
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [auth]);

  const login = async (employeeId: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await auth.login(employeeId, password);

      setUser({
        id: response.user_id,
        employee_id: response.employee_id,
        first_name: response.first_name,
        last_name: response.last_name,
      });

      setToken(auth.getAccessToken());
      setIsAuthenticated(true);
    } catch (err) {
      let errorMessage = 'An error occurred during login';

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      Alert.alert('Login Error', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await auth.logout();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error during logout:', err);
      Alert.alert('Error', 'Failed to logout properly');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (!isInitialized) {
    return null; // Or a loading spinner component
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    token,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;