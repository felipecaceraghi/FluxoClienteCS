import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import AdminDashboard from '../components/AdminDashboard';
import UserDashboard from '../components/UserDashboard';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  // Mostrar loading enquanto os dados do usuário estão sendo carregados
  if (loading) {
    return (
      <Layout title="Dashboard - Fluxo Cliente CS" requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Se não há usuário, não renderizar nada (será redirecionado pelo Layout)
  if (!user) {
    return (
      <Layout title="Dashboard - Fluxo Cliente CS" requireAuth={true}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard - Fluxo Cliente CS" requireAuth={true}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-10 w-auto mr-3 object-contain"
              />
              <h1 className="text-xl font-semibold text-gray-900">Fluxo Cliente CS</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Olá, <span className="font-medium">{user?.name}</span>
                {user?.role === 'admin' && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
      </main>
    </Layout>
  );
}
