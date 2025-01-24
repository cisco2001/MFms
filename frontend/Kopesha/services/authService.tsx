import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

interface LoginResponse {
  access: string;
  refresh: string;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface UserData {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

class AuthService {
  private API_BASE_URL = 'http://localhost:8000/api/';

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(`${this.API_BASE_URL}/api/token/`, {
        email,
        password
      });

      await this.storeTokens(response.data);
      return response.data;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
  }

  async refreshToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    try {
      const response = await axios.post<{ access: string }>(`${this.API_BASE_URL}/api/token/refresh/`, {
        refresh: refreshToken
      });

      await SecureStore.setItemAsync('accessToken', response.data.access);
      return response.data.access;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  private async storeTokens(data: LoginResponse): Promise<void> {
    await SecureStore.setItemAsync('accessToken', data.access);
    await SecureStore.setItemAsync('refreshToken', data.refresh);
    
    const userData: UserData = {
      userId: data.user_id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      employeeId: data.employee_id
    };
    
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  }

  setupAxiosInterceptors(): void {
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newAccessToken = await this.refreshToken();
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
}

export default new AuthService();