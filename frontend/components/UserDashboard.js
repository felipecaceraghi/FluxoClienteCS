import { useState, useEffect, useRef } from 'react';
import { Search, FileSpreadsheet, Loader2, AlertCircle, ChevronDown, X, FileCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function UserDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [spreadsheetFiles, setSpreadsheetFiles] = useState(null); // Para planilhas duplas
  const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim().length > 0 && !selectedGroup) {
      const filtered = availableGroups.filter(group => 
        group.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredGroups([]);
      setShowDropdown(false);
    }
  }, [searchTerm, availableGroups, selectedGroup]);

  useEffect(() => {
    // Fechar dropdown quando clicar fora
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAvailableGroups = async () => {
    if (availableGroups.length > 0) return; // Só buscar uma vez

    try {
      setLoading(true);
      const token = localStorage.getItem('fluxoclientecs_token');
      
  const response = await axios.get(`${API_BASE_URL}/api/group-search/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAvailableGroups(response.data.grupos || []);
      } else {
        throw new Error(response.data.error || 'Erro ao carregar grupos');
      }
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast.error('Erro ao carregar grupos disponíveis');
      setAvailableGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSearchTerm(group);
    setShowDropdown(false);
    setFilteredGroups([]); // Limpar filtros para forçar fechamento
    
    // Remover foco do input após um pequeno delay
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 100);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Se o valor for diferente do grupo selecionado, limpar seleção
    if (value !== selectedGroup) {
      setSelectedGroup('');
    }
    
    // Buscar grupos na primeira digitação
    if (value.length === 1 && availableGroups.length === 0) {
      fetchAvailableGroups();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredGroups.length === 1) {
        handleGroupSelect(filteredGroups[0]);
      } else if (selectedGroup || searchTerm.trim()) {
        generateReport();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleInputBlur = () => {
    // Pequeno delay para permitir que o click no dropdown seja processado
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  const [validating, setValidating] = useState(false);

  // Função para validar e enviar planilhas duplas
  const validateAndSendDualFiles = async (approved) => {
    if (!spreadsheetFiles) return;

    if (!approved) {
      setSpreadsheetFiles(null);
      toast.info('Planilhas rejeitadas. Nenhuma ação foi tomada.');
      return;
    }

    try {
      setValidating(true);
      const token = localStorage.getItem('fluxoclientecs_token');

      const fileNames = spreadsheetFiles.planilhas.map(p => p.fileName);

      const response = await axios.post(
        `${API_BASE_URL}/api/xlsx-generator/validate-and-send-dual`,
        {
          fileNames: fileNames,
          grupo: spreadsheetFiles.grupo,
          approved: true,
          enviarSeparado: true // Sempre enviar separado
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const emailResults = response.data.data.emailResults;
        const sucessos = emailResults.filter(r => r.emailSent).length;
        
        // Sempre envia separado
        toast.success(`${sucessos}/${emailResults.length} planilhas enviadas separadamente!`);
        setSpreadsheetFiles(null);
      } else {
        throw new Error(response.data.error || 'Erro ao enviar planilhas');
      }
    } catch (error) {
      console.error('Erro ao validar planilhas:', error);
      toast.error('Erro ao enviar planilhas. Tente novamente.');
    } finally {
      setValidating(false);
    }
  };

  // Função para validar e enviar planilha simples
  const isValidSelection = () => {
    // Grupo deve estar selecionado OU o texto digitado deve corresponder exatamente a um grupo
    return selectedGroup || 
      !!availableGroups.find(group => 
        group.toLowerCase() === searchTerm.trim().toLowerCase()
      );
  };

  const generateReport = async () => {
    if (!isValidSelection()) {
      toast.error('Selecione um grupo válido para gerar as planilhas');
      return;
    }

    const groupName = selectedGroup || searchTerm.trim();

    try {
      setGenerating(true);
      const token = localStorage.getItem('fluxoclientecs_token');

      // Sempre gerar planilhas duplas (entrada e cobrança)
      const generateResponse = await axios.post(
        `${API_BASE_URL}/api/xlsx-generator/generate-dual`,
        {
          grupo: groupName,
          tiposPlanilha: ['entrada', 'cobranca'], // Sempre gerar ambas
          enviarSeparado: true, // Sempre enviar separado
          emailDestinatario: 'felipe.caceraghi@gofurthergroup.com.br'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!generateResponse.data.success) {
        throw new Error(generateResponse.data.error || 'Erro ao gerar planilhas');
      }

      const planilhas = generateResponse.data.data.planilhas;

      // Fazer download de cada arquivo gerado
      for (const planilha of planilhas) {
        const downloadResponse = await axios.get(
          `${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            responseType: 'blob'
          }
        );

        // Criar URL do blob e forçar download
        const blob = new Blob([downloadResponse.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = planilha.fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      // Preparar dados para o modal de validação
      setSpreadsheetFiles(generateResponse.data.data);
      
      const tiposNomes = planilhas.map(p => p.tipo === 'entrada' ? 'Entrada' : 'Honorários').join(' e ');
      toast.success(`Planilhas de ${tiposNomes} baixadas para ${groupName} - ${generateResponse.data.data.empresas} empresas! Verifique sua pasta de Downloads.`);
      
      // Limpar campo após sucesso
      setSearchTerm('');
      setSelectedGroup('');
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      
      if (error.response?.status === 404) {
        toast.error(`Grupo "${groupName}" não encontrado`);
      } else if (error.response?.status === 400) {
        console.log('Erro 400 - Response:', error.response);
        const errorMsg = error.response?.data?.error || 'Dados inválidos para o grupo selecionado';
        toast.error(`${errorMsg} (Grupo: "${groupName}")`);
      } else {
        toast.error('Erro ao gerar planilhas');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gerar Planilhas
          </h2>
          <p className="text-gray-600">
            Pesquise e selecione um grupo para gerar as planilhas de entrada e honorários
          </p>
        </div>

        {/* Search Section */}
      <div className="card max-w-2xl mx-auto">
        <div className="space-y-4">
            {/* Campo de Pesquisa com Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Digite para pesquisar grupos..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onFocus={() => {
                  // Só mostra dropdown se ainda não tem grupo selecionado
                  if (!selectedGroup && filteredGroups.length > 0) {
                    setShowDropdown(true);
                  }
                  if (availableGroups.length === 0) {
                    fetchAvailableGroups();
                  }
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  selectedGroup ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
              {!loading && filteredGroups.length > 0 && (
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              {selectedGroup && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Dropdown de Sugestões */}
            {showDropdown && filteredGroups.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredGroups.map((group, index) => (
                  <button
                    key={index}
                    onMouseDown={(e) => {
                      // Previne que o onBlur do input seja chamado antes do onClick
                      e.preventDefault();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupSelect(group);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center">
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">{group}</span>
                      {selectedGroup === group && (
                        <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}            {/* Mensagem quando não encontrar resultados */}
            {showDropdown && searchTerm.trim() && filteredGroups.length === 0 && !loading && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <div className="flex items-center text-gray-500">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Nenhum grupo encontrado para "{searchTerm}"</span>
                </div>
              </div>
            )}
          </div>

          {/* Botão Gerar */}
          <button
            onClick={generateReport}
            disabled={generating || !isValidSelection()}
            className={`w-full flex items-center justify-center space-x-2 py-3 transition-all ${
              isValidSelection() && !generating
                ? 'btn-primary'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Gerando Planilhas...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                <span>
                  {!isValidSelection() 
                    ? 'Selecione um grupo primeiro'
                    : 'Gerar Planilhas'
                  }
                </span>
              </>
            )}
          </button>

          {/* Status da Seleção */}
          {searchTerm && (
            <div className="text-center text-sm">
              {selectedGroup ? (
                <span className="text-green-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Grupo selecionado: <strong className="ml-1">{selectedGroup}</strong>
                </span>
              ) : isValidSelection() ? (
                <span className="text-green-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Grupo válido detectado: <strong className="ml-1">{searchTerm}</strong>
                </span>
              ) : (
                <span className="text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Digite ou selecione um grupo válido
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium mb-1">Como usar:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Digite o nome do grupo no campo de pesquisa</li>
              <li>• Clique no grupo desejado na lista suspensa</li>
              <li>• O campo ficará verde quando um grupo válido for selecionado</li>
              <li>• Clique em "Gerar Planilhas" para criar automaticamente ambas as planilhas</li>
              <li>• Serão geradas: Ficha de Entrada e Honorários e Cobrança</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Modal de Validação - Planilhas Duplas */}
    {spreadsheetFiles && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                📊 Validar Planilhas Geradas
              </h3>
              <button
                onClick={() => setSpreadsheetFiles(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Informações do Grupo</h4>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Grupo:</strong> {spreadsheetFiles.grupo}
                </p>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Empresas encontradas:</strong> {spreadsheetFiles.empresas}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Gerado em:</strong> {new Date(spreadsheetFiles.geradoEm).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Planilhas Geradas:</h4>
                {spreadsheetFiles.planilhas.map((planilha, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {planilha.tipo === 'entrada' ? '📄 Ficha de Entrada' : '💰 Honorários e Cobrança'}
                        </p>
                        <p className="text-sm text-gray-600">{planilha.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {planilha.totalLinhas} linhas • {planilha.totalEmpresas} empresas
                        </p>
                      </div>
                      <div className="text-green-600">
                        <FileCheck className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Configuração de Envio</h4>
                <div className="space-y-2 text-sm text-yellow-700">
                  <p><strong>Destino:</strong> felipe.caceraghi@gofurthergroup.com.br</p>
                  <p><strong>Modo de envio:</strong> Emails separados (uma planilha por email)</p>
                  <p><strong>Pasta de salvamento:</strong> R:\Publico\felipec</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Próximos passos:</strong> As planilhas foram baixadas para sua pasta de Downloads. 
                  Verifique os arquivos e confirme se estão corretos antes de enviar por email.
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex space-x-3">
            <button
              onClick={() => validateAndSendDualFiles(false)}
              disabled={validating}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Rejeitar
            </button>
            <button
              onClick={() => validateAndSendDualFiles(true)}
              disabled={validating}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Enviando...
                </>
              ) : (
                'Aprovar e Enviar por Email'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
