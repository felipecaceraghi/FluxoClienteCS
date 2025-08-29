import Layout from '../../components/Layout';
import { Construction, AlertTriangle } from 'lucide-react';

export default function DashboardSaida() {
  return (
    <Layout title="Ficha de Saída - Em Construção" requireAuth={true}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <Construction className="w-24 h-24 text-orange-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Em Construção
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                A Ficha de Saída está sendo desenvolvida
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">Funcionalidade Temporariamente Indisponível</span>
              </div>
              <p className="text-sm text-yellow-700">
                Esta funcionalidade estará disponível em breve. Agradecemos sua compreensão.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full btn-secondary"
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full btn-primary"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
