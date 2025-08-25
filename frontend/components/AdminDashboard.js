import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Users, FileSpreadsheet, RefreshCw, UserCheck } from 'lucide-react';
import UserDashboard from './UserDashboard';
import axios from 'axios';

export default function AdminDashboard() {
  const router = useRouter();
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [stats, setStats] = useState({
    totalEmpresas: 0,
    relatoriosGerados: 0,
    ultimaSync: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (preserveLastSync = false) => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('fluxoclientecs_token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
      
      // Buscar estatísticas reais
      const [empresasResponse, relatoriosResponse, syncResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/companies/count`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'bypass-tunnel-reminder': 'true',
            'User-Agent': 'FluxoClienteCS/1.0'
          }
        }),
        axios.get(`${API_BASE_URL}/api/xlsx-generator/stats`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'bypass-tunnel-reminder': 'true',
            'User-Agent': 'FluxoClienteCS/1.0'
          }
        }),
        axios.get(`${API_BASE_URL}/api/sync/stats`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'bypass-tunnel-reminder': 'true',
            'User-Agent': 'FluxoClienteCS/1.0'
          }
        })
      ]);

      // Usar a data de sincronização do sync service se disponível
      let ultimaSync = null;
      if (syncResponse.data.success && syncResponse.data.data?.lastSyncDate) {
        ultimaSync = syncResponse.data.data.lastSyncDate;
      } else if (relatoriosResponse.data.lastSync) {
        ultimaSync = relatoriosResponse.data.lastSync;
      }

      setStats(prevStats => ({
        totalEmpresas: empresasResponse.data.count || 0,
        relatoriosGerados: relatoriosResponse.data.totalReports || 0,
        // Se preserveLastSync for true, mantém a data atual, senão usa a do servidor
        ultimaSync: preserveLastSync ? prevStats.ultimaSync : ultimaSync,
      }));
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Fallback com dados básicos
      setStats(prevStats => ({
        totalEmpresas: 0,
        relatoriosGerados: 0,
        ultimaSync: preserveLastSync ? prevStats.ultimaSync : null,
      }));
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSyncEmpresas = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('fluxoclientecs_token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
      
      await axios.post(`${API_BASE_URL}/api/sync/manual`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'bypass-tunnel-reminder': 'true',
          'User-Agent': 'FluxoClienteCS/1.0'
        }
      });
      
      // Atualizar estatísticas após sincronização para mostrar nova data
      setStats(prevStats => ({
        ...prevStats,
        ultimaSync: new Date().toISOString()
      }));
      
      // Buscar dados atualizados, mas preservar a data de sincronização que acabamos de definir
      setTimeout(() => {
        fetchStats(true); // true = preservar ultimaSync
      }, 1000);
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao executar sincronização manual');
    } finally {
      setSyncing(false);
    }
  };

  if (showUserDashboard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Gerar Relatórios
          </h2>
          <button
            onClick={() => setShowUserDashboard(false)}
            className="btn-secondary"
          >
            Voltar ao Dashboard Admin
          </button>
        </div>
        <UserDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo ao Dashboard
        </h2>
        <p className="text-gray-600">
          Gerencie empresas e relatórios do sistema Fluxo Cliente CS
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.totalEmpresas}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Relatórios Gerados</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingStats ? '...' : stats.relatoriosGerados}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Última Sincronização</p>
              <p className="text-sm text-gray-900">
                {loadingStats ? '...' : (
                  stats.ultimaSync ? 
                    new Date(stats.ultimaSync).toLocaleString('pt-BR') : 
                    'Nunca'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
          onClick={() => router.push('/admin/users')}
        >
          <div className="text-center flex-1 flex flex-col justify-between">
            <div>
              <UserCheck className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gerenciar Usuários
              </h3>
              <p className="text-gray-600 mb-4">
                Administre usuários do sistema
              </p>
            </div>
            <div className="flex justify-center">
              <button className="btn-primary">
                Acessar
              </button>
            </div>
          </div>
        </div>

        <div 
          className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
          onClick={handleSyncEmpresas}
        >
          <div className="text-center flex-1 flex flex-col justify-between">
            <div>
              <RefreshCw className={`w-12 h-12 text-blue-600 mx-auto mb-4 ${syncing ? 'animate-spin' : ''}`} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sincronizar Empresas
              </h3>
              <p className="text-gray-600 mb-4">
                Execute sincronização manual do SharePoint
              </p>
            </div>
            <div className="flex justify-center">
              <button 
                className="btn-primary"
                disabled={syncing}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
          </div>
        </div>

        <div 
          className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
          onClick={() => setShowUserDashboard(true)}
        >
          <div className="text-center flex-1 flex flex-col justify-between">
            <div>
              <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gerar Relatórios
              </h3>
              <p className="text-gray-600 mb-4">
                Crie planilhas de entrada para grupos de empresas
              </p>
            </div>
            <div className="flex justify-center">
              <button className="btn-primary">
                Gerar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Atividade Recente
        </h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span className="text-gray-600">
              Relatório gerado para Grupo Teklamatik - {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            <span className="text-gray-600">
              Sincronização automática executada - {new Date(Date.now() - 15*60000).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
            <span className="text-gray-600">
              Login realizado - {new Date().toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
