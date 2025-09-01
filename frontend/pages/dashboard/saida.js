import Layout from '../../components/Layout';
import UserDashboard from '../../components/UserDashboard';
import { useAuth } from '../../context/AuthContext';

export default function DashboardSaida() {
  const { loading } = useAuth();

  if (loading) return (
    <Layout title="Ficha de Saída - Fluxo Cliente CS" requireAuth={true}>
      <div className="min-h-screen flex items-center justify-center">Carregando...</div>
    </Layout>
  );

  return (
    <Layout title="Ficha de Saída - Fluxo Cliente CS" requireAuth={true}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-8 bg-gray-200 border rounded-lg shadow opacity-70 select-none">
          <h1 className="text-2xl font-semibold mb-4 text-gray-500">Ficha de Saída</h1>
          <p className="text-lg text-gray-500 flex items-center gap-2">
            🚧 Em construção
          </p>
        </div>
      </main>
    </Layout>
  );
}
