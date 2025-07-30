import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { authService, apiClient } from '../services';
import { useUser } from './UserContext';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  register: (
    data: import('../services/authService').RegisterRequest,
  ) => Promise<boolean>;
  verifyEmail: (
    data: import('../services/authService').VerifyEmailRequest,
  ) => Promise<boolean>;
  forgotPassword: (
    data: import('../services/authService').ForgotPasswordRequest,
  ) => Promise<boolean>;
  newPassword: (
    data: import('../services/authService').NewPasswordRequest,
  ) => Promise<boolean>;
  changePassword: (
    data: import('../services/authService').ChangePasswordRequest,
  ) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: false,
  login: async () => false,
  register: async () => false,
  verifyEmail: async () => false,
  forgotPassword: async () => false,
  newPassword: async () => false,
  changePassword: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { setUser } = useUser();

  // Attempt to load token from localStorage on mount
  useEffect(() => {
    apiClient.loadAuth();
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = async (userId: string, password: string) => {
    setLoading(true);
    const response = await authService.login({ userId, password });
    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      apiClient.setUserId(response.data.userId.toString());
      setUser({
        id: response.data.userId.toString(),
        name: `${response.data.userName} ${response.data.userLastName ?? ''}`.trim(),
        avatar: '',
        email: '',
      });
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const register = async (
    data: import('../services/authService').RegisterRequest,
  ) => {
    setLoading(true);
    const res = await authService.register(data);
    setLoading(false);
    return res.success;
  };

  const verifyEmail = async (
    data: import('../services/authService').VerifyEmailRequest,
  ) => {
    const res = await authService.verifyEmail(data);
    return res.success;
  };

  const forgotPassword = async (
    data: import('../services/authService').ForgotPasswordRequest,
  ) => {
    const res = await authService.forgotPassword(data);
    return res.success;
  };

  const newPassword = async (
    data: import('../services/authService').NewPasswordRequest,
  ) => {
    const res = await authService.newPassword(data);
    return res.success;
  };

  const changePassword = async (
    data: import('../services/authService').ChangePasswordRequest,
  ) => {
    const res = await authService.changePassword(data);
    return res.success;
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        newPassword,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
