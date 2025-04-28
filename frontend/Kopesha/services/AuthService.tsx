import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginResponse {
  access: string;
  refresh: string;
  user_id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
}

export interface UserData {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
}

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryUserData: UserData | null = null;

export class AuthService {
  private API_BASE_URL = 'http://192.168.100.16:8000/';
  private tokenExpiryTime: number | null = null;
  private refreshTokenExpiryTime: number | null = null;
  private refreshPromise: Promise<string> | null = null;

  private async saveTokens(access: string, refresh: string) {
    try {
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      inMemoryToken = access;
      inMemoryRefreshToken = refresh;
      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  private async loadTokens() {
    try {
      inMemoryToken = await AsyncStorage.getItem('accessToken');
      inMemoryRefreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('Tokens loaded:', { inMemoryToken, inMemoryRefreshToken });
      if (inMemoryToken) {
        this.setTokenExpiry(inMemoryToken);
      }
      if (inMemoryRefreshToken) {
        this.setRefreshTokenExpiry(inMemoryRefreshToken);
      }
      return { access: inMemoryToken, refresh: inMemoryRefreshToken };
    } catch (error) {
      console.error('Error loading tokens:', error);
      return { access: null, refresh: null };
    }
  }

  private async saveUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      inMemoryUserData = userData;
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  private async loadUserData(): Promise<UserData | null> {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        inMemoryUserData = JSON.parse(data);
        console.log('User data loaded:', inMemoryUserData);
      }
      return inMemoryUserData;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }

  public getAccessToken(): string | null {
    return inMemoryToken;
  }

  private setTokenExpiry(token: string) {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      this.tokenExpiryTime = decoded.exp * 1000; // Convert to milliseconds
      console.log('Access token expires at:', new Date(this.tokenExpiryTime));
    } catch (error) {
      console.error('Error decoding token:', error);
      this.tokenExpiryTime = null;
    }
  }

  private setRefreshTokenExpiry(token: string) {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      this.refreshTokenExpiryTime = decoded.exp * 1000; // Convert to milliseconds
      console.log('Refresh token expires at:', new Date(this.refreshTokenExpiryTime));
    } catch (error) {
      console.error('Error decoding refresh token:', error);
      this.refreshTokenExpiryTime = null;
    }
  }

  public isTokenExpired(): boolean {
    console.log(Date.now(), this.tokenExpiryTime);
    const isExpired = this.tokenExpiryTime ? Date.now() >= this.tokenExpiryTime - 30000 : true; // 30-second buffer
    console.log('Is access token expired?', isExpired);
    return isExpired;
  }

  public isRefreshTokenExpired(): boolean {
    const isExpired = this.refreshTokenExpiryTime ? Date.now() >= this.refreshTokenExpiryTime : true;
    console.log('Is refresh token expired?', isExpired);
    return isExpired;
  }

  public async initialize(): Promise<void> {
    await this.loadTokens();
    await this.loadUserData();
    this.setupAxiosInterceptors();
  }

  public async login(employee_id: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${this.API_BASE_URL}/api/token/`,
        { employee_id, password }
      );

      await this.saveTokens(response.data.access, response.data.refresh);
      this.setTokenExpiry(response.data.access);
      this.setRefreshTokenExpiry(response.data.refresh);

      await this.saveUserData({
        id: response.data.user_id,
        employee_id: response.data.employee_id,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
      });

      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid credentials. Please try again.');
        }
        throw new Error(error.response?.data?.detail || 'An error occurred while logging in.');
      }
      throw new Error('An error occurred while logging in. Please try again later.');
    }
  }

  public async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        if (this.isRefreshTokenExpired()) {
          throw new Error('Refresh token has expired');
        }

        const response = await axios.post<{ access: string }>(
          `${this.API_BASE_URL}/api/token/refresh/`,
          { refresh: refreshToken }
        );

        await this.saveTokens(response.data.access, refreshToken);
        this.setTokenExpiry(response.data.access);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        return response.data.access;
      } catch (error) {
        console.error('Refresh token error:', error);
        await this.logout();
        throw new Error('Session expired. Please log in again.');
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
      inMemoryToken = null;
      inMemoryRefreshToken = null;
      inMemoryUserData = null;
      this.tokenExpiryTime = null;
      this.refreshTokenExpiryTime = null;
      delete axios.defaults.headers.common['Authorization'];
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  public setupAxiosInterceptors(): void {
    axios.interceptors.request.use(
      async (config) => {
        if (this.isTokenExpired() && !this.isRefreshTokenExpired()) {
          try {
            const newToken = await this.refreshToken();
            config.headers.Authorization = `Bearer ${newToken}`;
          } catch (error) {
            console.error('Token refresh failed in interceptor:', error);
            throw error;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (!originalRequest) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.error('Refresh token failed in response interceptor:', refreshError);
            await this.logout();
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public async isAuthenticated(): Promise<boolean> {
    const tokens = await this.loadTokens();
    if (!tokens.access || this.isTokenExpired()) {
      await this.logout();
      return false;
    }
    return true;
  }

  public async getCurrentUser(): Promise<UserData | null> {
    return this.loadUserData();
  }
}

const authService = new AuthService();
export default authService;