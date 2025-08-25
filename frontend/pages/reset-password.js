import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import { Eye, EyeOff, Lock, Check, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const { resetPassword } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    // Obter token da URL
    const { token: urlToken } = router.query;
    if (urlToken) {
      setToken(urlToken);
    }
  }, [router.query]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Token de recuperação inválido');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await resetPassword(token, data.password);
      
      if (result.success) {
        toast.success('Senha alterada com sucesso!');
        reset();
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error(result.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { test: (pwd) => pwd && pwd.length >= 8, text: 'Pelo menos 8 caracteres' },
    { test: (pwd) => pwd && /[A-Z]/.test(pwd), text: 'Uma letra maiúscula' },
    { test: (pwd) => pwd && /[a-z]/.test(pwd), text: 'Uma letra minúscula' },
    { test: (pwd) => pwd && /\d/.test(pwd), text: 'Um número' },
  ];

  if (!token) {
    return (
      <Layout title="Reset de Senha - FluxoClienteCS">
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Inválido</h2>
            <p className="text-gray-600 mb-6">
              O link de recuperação de senha é inválido ou expirou.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Nova Senha - FluxoClienteCS">
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
            <h2 className="mt-2 text-lg text-gray-600">Defina sua nova senha</h2>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label className="form-label">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Nova senha é obrigatória',
                      minLength: {
                        value: 8,
                        message: 'Senha deve ter pelo menos 8 caracteres',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                        message: 'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula e 1 número',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="Sua nova senha"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="form-label">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Confirmação de senha é obrigatória',
                      validate: (value) =>
                        value === password || 'As senhas não coincidem',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="Confirme sua nova senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Requisitos de Senha */}
              {password && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Requisitos da senha:
                  </h4>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <li
                        key={index}
                        className={`flex items-center text-sm ${
                          req.test(password) ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        <Check
                          className={`w-4 h-4 mr-2 ${
                            req.test(password) ? 'text-green-600' : 'text-gray-400'
                          }`}
                        />
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                    <Check className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 FluxoClienteCS. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
