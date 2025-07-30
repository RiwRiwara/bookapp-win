import apiClient from './api';

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  telephone: string;
  email: string;
  username: string;
  password: string;
  address: string;
}

export interface VerifyEmailRequest {
  otp: string;
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface NewPasswordRequest {
  Email: string;
  Password: string;
}

export interface ChangePasswordRequest {
  Password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  userName: string;
  userLastName: string;
}

// Auth service class
const authService = {
  /**
   * Login with username and password
   */
  login: async (request: LoginRequest) => {
    return apiClient.post<LoginResponse>('login', request);
  },

  /**
   * Register a new user
   */
  register: async (request: RegisterRequest) => {
    return apiClient.post<void>('register', request);
  },

  /**
   * Verify email with OTP
   */
  verifyEmail: async (request: VerifyEmailRequest) => {
    return apiClient.post<void>('verify-email', request);
  },

  /**
   * Request password reset
   */
  forgotPassword: async (request: ForgotPasswordRequest) => {
    return apiClient.post<void>('forgot-password', request);
  },

  /**
   * Set new password after reset
   */
  newPassword: async (request: NewPasswordRequest) => {
    return apiClient.post<void>('new-password', request);
  },

  /**
   * Change password when logged in
   */
  changePassword: async (request: ChangePasswordRequest) => {
    return apiClient.post<void>('change-password', request);
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    return apiClient.get<void>('health-check');
  },

  /**
   * Logout - clears local auth data
   */
  logout: () => {
    apiClient.clearAuth();
  },
};

export default authService;
