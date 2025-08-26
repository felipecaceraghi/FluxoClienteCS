import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

export default function Layout({ children, title = 'Fluxo Cliente CS', requireAuth = false }) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, requireAuth, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Componente será redirecionado
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sistema de gestão de fluxo de clientes CS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Common header (only for authenticated users) */}
        {isAuthenticated && (
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <img src="/logo.png" alt="Logo" className="h-10 w-auto mr-3 object-contain" />
                  <h1 className="text-xl font-semibold text-gray-900">Fluxo Cliente CS</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    Olá, <span className="font-medium">{user?.name || 'usuário'}</span>
                    {user?.role === 'admin' && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>
                    )}
                  </div>

                  <button
                    onClick={() => logout()}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        {children}
      </div>
    </>
  );
}
