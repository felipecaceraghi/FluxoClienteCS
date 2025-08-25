import { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../lib/auth';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Verificar se há token salvo
      const token = AuthService.getToken();
      const savedUser = AuthService.getUser();
      
      if (token) {
        if (savedUser && savedUser.email && savedUser.role) {
          // Dados salvos estão completos, usar imediatamente
          setUser(savedUser);
          setIsAuthenticated(true);
        }
        
        // Validar token e buscar dados atualizados em background
        try {
          const isValid = await AuthService.validateToken();
          
          if (isValid) {
            // Buscar dados atualizados do usuário
            const currentUser = await AuthService.getCurrentUser();
            
            if (currentUser && currentUser.email) {
              setUser(currentUser);
              setIsAuthenticated(true);
            } else if (!savedUser || !savedUser.email) {
              // Se não tem dados salvos válidos e não conseguiu buscar, logout
              logout();
            }
          } else {
            // Token inválido, fazer logout
            logout();
          }
        } catch (error) {
          // Se tem dados salvos válidos, mantém; senão faz logout
          if (!savedUser || !savedUser.email) {
            logout();
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar autenticação:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const result = await AuthService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Redirecionar para dashboard
        router.push('/dashboard');
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.error 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Erro inesperado no login' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const forgotPassword = async (email) => {
    try {
      const result = await AuthService.forgotPassword(email);
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao enviar email de recuperação'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const result = await AuthService.resetPassword(token, newPassword);
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao resetar senha'
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    forgotPassword,
    resetPassword,
    initializeAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}
