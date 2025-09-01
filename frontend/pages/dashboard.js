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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a href="/dashboard/entrada" className="block p-6 bg-white border rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-lg font-semibold mb-2">Ficha de Entrada</h3>
              <p className="text-sm text-gray-600">Gerar Ficha de Entrada e Honorários/Cobrança para um grupo ou empresa.</p>
            </a>

            <div
              className="block p-6 bg-gray-200 border rounded-lg shadow cursor-not-allowed opacity-70 select-none transition"
              style={{ cursor: 'not-allowed' }}
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-500">Ficha de Saída</h3>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                🚧 Em construção
              </p>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
