import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptador para adicionar token automaticamente
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptador para tratar respostas de erro
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Login
  async login(email, password) {
    try {
      const response = await this.api.post('/api/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Salvar token e dados do usuário
        this.setToken(token);
        this.setUser(user);
        
        return {
          success: true,
          user,
          token,
        };
      }

      return {
        success: false,
        error: response.data.message || 'Erro no login',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro de conexão',
      };
    }
  }

  // Recuperação de senha
  async forgotPassword(email) {
    try {
      const response = await this.api.post('/api/auth/forgot-password', {
        email,
      });

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao enviar email de recuperação',
      };
    }
  }

  // Reset de senha
  async resetPassword(token, newPassword) {
    try {
      const response = await this.api.post('/api/auth/reset-password', {
        token,
        newPassword,
      });

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erro ao resetar senha',
      };
    }
  }

  // Validar token
  async validateToken() {
    try {
      const response = await this.api.get('/api/auth/validate');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Obter dados do usuário logado
  async getCurrentUser() {
    try {
      const response = await this.api.get('/api/auth/me');
      
      if (response.data.success && response.data.data?.user) {
        const userData = response.data.data.user;
        this.setUser(userData);
        return userData;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Logout
  logout() {
    Cookies.remove('fluxoclientecs_token');
    Cookies.remove('fluxoclientecs_user');
    
    // Limpar localStorage também
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fluxoclientecs_token');
      localStorage.removeItem('fluxoclientecs_user');
    }
  }

  // Gerenciamento de token
  setToken(token) {
    Cookies.set('fluxoclientecs_token', token, { 
      expires: 7, // 7 dias
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluxoclientecs_token', token);
    }
  }

  getToken() {
    // Primeiro tenta dos cookies, depois localStorage
    let token = Cookies.get('fluxoclientecs_token');
    
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('fluxoclientecs_token');
    }
    
    return token;
  }

  // Gerenciamento de usuário
  setUser(user) {
    const userData = JSON.stringify(user);
    
    Cookies.set('fluxoclientecs_user', userData, { 
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('fluxoclientecs_user', userData);
    }
  }

  getUser() {
    // Primeiro tenta dos cookies, depois localStorage
    let userData = Cookies.get('fluxoclientecs_user');
    
    if (!userData && typeof window !== 'undefined') {
      userData = localStorage.getItem('fluxoclientecs_user');
    }
    
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Verificar se está logado
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }
}

export default new AuthService();
