import Layout from '../../components/Layout';
import UserDashboard from '../../components/UserDashboard';
import { useAuth } from '../../context/AuthContext';

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
        <UserDashboard initialMode="entrada" />
      </main>
    </Layout>
  );
}
