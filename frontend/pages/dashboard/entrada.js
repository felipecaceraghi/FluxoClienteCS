import Layout from '../../components/Layout';
import UserDashboard from '../../components/UserDashboard';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function DashboardEntrada() {
  const { user, loading } = useAuth();

  if (loading) return (
    <Layout title="Ficha de Entrada - Fluxo Cliente CS" requireAuth={true}>
      <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    </Layout>
  );

  return (
    <Layout title="Ficha de Entrada - Fluxo Cliente CS" requireAuth={true}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botão de Voltar */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </button>
        </div>

        <UserDashboard initialMode="entrada" />
      </main>
    </Layout>
  );
}
