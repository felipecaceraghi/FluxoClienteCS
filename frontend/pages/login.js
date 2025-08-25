import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, forgotPassword } = useAuth();
  const router = useRouter();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm();

  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
    reset: resetForgot,
  } = useForm();

  const onLoginSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        toast.success('Login realizado com sucesso!');
        // Redirecionamento é feito automaticamente no context
      } else {
        toast.error(result.error || 'Erro no login');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await forgotPassword(data.email);
      
      if (result.success) {
        toast.success('Email de recuperação enviado!');
        setShowForgotPassword(false);
        resetForgot();
      } else {
        toast.error(result.error || 'Erro ao enviar email');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    resetLogin();
    resetForgot();
  };

  return (
    <Layout title="Login - Fluxo Cliente CS">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Fluxo Cliente CS</h1>
            <h2 className="mt-2 text-lg text-gray-600">
              {showForgotPassword ? 'Recuperar Senha' : 'Entre na sua conta'}
            </h2>
          </div>

          {/* Login Form */}
          {!showForgotPassword && (
            <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit(onLoginSubmit)}>
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="form-label">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email
                  </label>
                  <input
                    {...registerLogin('email', {
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido',
                      },
                    })}
                    type="email"
                    className="form-input"
                    placeholder="seu@email.com"
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                  )}
                </div>

                {/* Senha */}
                <div>
                  <label className="form-label">
                    <Lock className="inline w-4 h-4 mr-2" />
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      {...registerLogin('password', {
                        required: 'Senha é obrigatória',
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="form-input pr-10"
                      placeholder="Sua senha"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {showForgotPassword && (
            <form className="mt-8 space-y-6" onSubmit={handleForgotSubmit(onForgotSubmit)}>
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  Digite seu email para receber as instruções de recuperação de senha.
                </div>

                {/* Email */}
                <div>
                  <label className="form-label">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email
                  </label>
                  <input
                    {...registerForgot('email', {
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido',
                      },
                    })}
                    type="email"
                    className="form-input"
                    placeholder="seu@email.com"
                  />
                  {forgotErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{forgotErrors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Email
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Fluxo Cliente CS. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
