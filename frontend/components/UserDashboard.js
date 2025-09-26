import { useState, useEffect, useRef } from 'react';
import { Search, FileSpreadsheet, Loader2, AlertCircle, ChevronDown, X, Building2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function UserDashboard({ initialMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState(initialMode || 'entrada'); // 'entrada' or 'saida'
  const [availableGroups, setAvailableGroups] = useState([]);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]); // Novo: array para múltiplos clientes
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [spreadsheetFiles, setSpreadsheetFiles] = useState(null);
  const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const isSelectingRef = useRef(false);

  // Função para debounce da busca
  const debouncedSearch = (term) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (term.trim().length >= 2) {
        fetchAutocompleteResults(term);
      } else {
        setAutocompleteResults([]);
        setShowDropdown(false);
      }
    }, 300);
  };

  useEffect(() => {
    // Não faz busca se estamos no meio de uma seleção programática
    if (isSelectingRef.current) {
      return;
    }

    // Só limpa a seleção se o usuário está digitando algo diferente
    if (searchTerm !== (selectedItem?.value || '')) {
      setSelectedItem(null);
    }

    // Faz busca apenas se o termo tem pelo menos 2 caracteres
    if (searchTerm.trim().length >= 2) {
      debouncedSearch(searchTerm);
    } else {
      setAutocompleteResults([]);
      setShowDropdown(false);
    }
  }, [searchTerm, selectedItem]);

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

  // Nova função para buscar autocomplete (grupos e nomes)
  const fetchAutocompleteResults = async (query) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('fluxoclientecs_token');

      const response = await axios.get(`${API_BASE_URL}/api/companies/autocomplete`, {
        params: { q: query, limit: 15 },
        headers: {
          'Authorization': `Bearer ${token}`,
          'bypass-tunnel-reminder': 'true',
          'User-Agent': 'FluxoClienteCS/1.0'
        }
      });

      if (response.data.success) {
        setAutocompleteResults(response.data.data || []);
        setShowDropdown(response.data.data.length > 0);
      } else {
        throw new Error(response.data.error || 'Erro ao buscar resultados');
      }
    } catch (error) {
      console.error('Erro ao buscar autocomplete:', error);
      setAutocompleteResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar cliente à seleção múltipla
  const addClientToSelection = (client) => {
    if (!selectedClients.find(c => c.value === client.value)) {
      setSelectedClients(prev => [...prev, client]);
      setSearchTerm('');
      setSelectedItem(null);
      setShowDropdown(false);
    }
  };

  // Função para remover cliente da seleção
  const removeClientFromSelection = (clientValue) => {
    setSelectedClients(prev => prev.filter(c => c.value !== clientValue));
  };

  // Função para limpar toda seleção
  const clearSelection = () => {
    setSelectedClients([]);
    setSelectedItem(null);
    setSearchTerm('');
  };

  // Single set of input handlers and actions (removed duplicate definitions)
  const handleItemSelect = (item) => {
    // Previne qualquer busca durante a seleção
    isSelectingRef.current = true;

    // Adiciona à seleção múltipla em vez de definir um único item
    addClientToSelection(item);

    // Libera o controle após um breve delay
    setTimeout(() => {
      isSelectingRef.current = false;
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 150);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Usuário está digitando, então libera qualquer controle programático
    isSelectingRef.current = false;

    setSearchTerm(value);

    // Só limpa a seleção se o valor for diferente do item selecionado
    if (value !== (selectedItem?.value || '')) {
      setSelectedItem(null);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (autocompleteResults.length === 1) handleItemSelect(autocompleteResults[0]);
      else if (selectedItem || isValidSelection()) generateReport();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleInputBlur = () => {
    // Pequeno delay para permitir que o click no dropdown seja processado
    setTimeout(() => setShowDropdown(false), 150);
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

      // Determinar o endpoint baseado no tipo de geração
      const endpoint = spreadsheetFiles.isMultiSelection 
        ? '/api/xlsx-generator/validate-and-send-multi'
        : '/api/xlsx-generator/validate-and-send-dual';

      const requestBody = spreadsheetFiles.isMultiSelection
        ? { 
            fileNames, 
            selectedClients: spreadsheetFiles.selectedClients,
            approved: true, 
            enviarSeparado: true 
          }
        : { 
            fileNames, 
            grupo: spreadsheetFiles.grupo, 
            approved: true, 
            enviarSeparado: true 
          };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, requestBody, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }
      });

      if (response.data.success) {
        const emailResults = response.data.data.emailResults;
        const sucessos = emailResults.filter(r => r.emailSent).length;
        const tipoSelecao = spreadsheetFiles.isMultiSelection ? 'empresas selecionadas' : 'grupo';
        toast.success(`${sucessos}/${emailResults.length} planilhas enviadas separadamente para ${tipoSelecao}!`);
        setSpreadsheetFiles(null);
      } else {
        throw new Error(response.data.error || 'Erro ao enviar planilhas');
      }
    } catch (error) {
      console.error('Erro ao validar planilhas:', error);
      toast.error('Erro ao enviar planilhas. Tente novamente.');
    } finally { setValidating(false); }
  };

  // Função para validar se a seleção é válida
  const isValidSelection = () => {
    // Se há múltiplos clientes selecionados, é válido
    if (selectedClients.length > 0) return true;
    
    // Caso contrário, verifica seleção única (compatibilidade)
    if (selectedItem && selectedItem.type) return true;
    return !!availableGroups.find(group => group.toLowerCase() === searchTerm.trim().toLowerCase());
  };

  const getSelectedValue = () => selectedItem ? selectedItem.value : searchTerm.trim();

  const generateReport = async () => {
    if (!isValidSelection()) { toast.error('Selecione um grupo válido, empresa ou múltiplas empresas para gerar as planilhas'); return; }
    
    // Verifica se é seleção múltipla
    const isMultiSelection = selectedClients.length > 0;
    
    try {
      setGenerating(true);
      const token = localStorage.getItem('fluxoclientecs_token');

      if (isMultiSelection) {
        // Geração para múltiplos clientes
        const clientCodes = selectedClients.map(client => client.codigo);
        
        if (mode === 'entrada') {
          // Para múltiplos clientes, usar endpoint de múltiplos
          const requestBody = { 
            clientCodes, 
            tiposPlanilha: ['entrada', 'cobranca'], 
            enviarSeparado: true, 
            emailDestinatario: 'felipe.caceraghi@gofurthergroup.com.br' 
          };
          const generateResponse = await axios.post(`${API_BASE_URL}/api/xlsx-generator/generate-multi-entrada`, requestBody, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' } 
          });
          if (!generateResponse.data.success) throw new Error(generateResponse.data.error || 'Erro ao gerar planilhas múltiplas de entrada');
          
          const planilhas = generateResponse.data.data.planilhas || [];
          for (const planilha of planilhas) {
            const downloadResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`, { 
              headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }, 
              responseType: 'blob' 
            });
            const blob = new Blob([downloadResponse.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob); 
            const link = document.createElement('a'); 
            link.href = url; 
            link.download = planilha.fileName; 
            document.body.appendChild(link); 
            link.click(); 
            document.body.removeChild(link); 
            window.URL.revokeObjectURL(url);
          }
          
          setSpreadsheetFiles({ 
            ...generateResponse.data.data, 
            geradoEm: generateResponse.data.data.geradoEm || new Date().toISOString(),
            isMultiSelection: true,
            selectedClients: selectedClients
          });
          
          const tiposNomes = (generateResponse.data.data.planilhas || []).map(p => p.tipo === 'entrada' ? 'Entrada' : 'Honorários').join(' e ');
          toast.success(`Planilhas de ${tiposNomes} baixadas para ${selectedClients.length} empresas selecionadas! Verifique sua pasta de Downloads.`);
          clearSelection();
        } else {
          // Saída múltipla
          const generateResponse = await axios.post(`${API_BASE_URL}/api/xlsx-saida/multi-clients`, { clientCodes }, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' } 
          });
          if (!generateResponse.data.success) throw new Error(generateResponse.data.error || 'Erro ao gerar planilhas múltiplas de saída');
          
          const data = generateResponse.data.data; 
          const planilhas = data.planilhas || [];
          for (const planilha of planilhas) {
            const downloadResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`, { 
              headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }, 
              responseType: 'blob' 
            });
            const blob = new Blob([downloadResponse.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob); 
            const link = document.createElement('a'); 
            link.href = url; 
            link.download = planilha.fileName; 
            document.body.appendChild(link); 
            link.click(); 
            document.body.removeChild(link); 
            window.URL.revokeObjectURL(url);
          }
          
          setSpreadsheetFiles({ 
            planilhas: planilhas.map(p => ({ fileName: p.fileName, tipo: p.tipo })), 
            grupo: `Múltiplas Empresas (${selectedClients.length})`, 
            empresas: selectedClients.length, 
            geradoEm: new Date().toISOString(),
            isMultiSelection: true,
            selectedClients: selectedClients
          });
          
          toast.success(`Planilhas de Saída baixadas para ${selectedClients.length} empresas selecionadas! Verifique sua pasta de Downloads.`);
          clearSelection();
        }
      } else {
        // Lógica existente para seleção única
        const searchValue = getSelectedValue();
        const isEmpresaIndividual = selectedItem?.type === 'nome';

        if (mode === 'entrada') {
          if (isEmpresaIndividual) {
            // Para empresa individual, usar endpoint específico
            const generateResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/generate-entrada-cliente/${selectedItem.codigo}`, { headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' } });
            if (!generateResponse.data.success) throw new Error(generateResponse.data.error || 'Erro ao gerar planilha de entrada');
            const planilha = generateResponse.data.data;
            const downloadResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`, { headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }, responseType: 'blob' });
            const blob = new Blob([downloadResponse.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = planilha.fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
            setSpreadsheetFiles({ planilhas: [{ fileName: planilha.fileName, tipo: 'entrada' }], grupo: searchValue, empresas: 1, geradoEm: new Date().toISOString() });
            toast.success(`Planilha de Entrada baixada para empresa ${searchValue}. Verifique sua pasta de Downloads.`);
            setSearchTerm(''); setSelectedItem(null);
          } else {
            // Para grupo, manter comportamento atual
            const requestBody = { grupo: searchValue, tiposPlanilha: ['entrada', 'cobranca'], enviarSeparado: true, emailDestinatario: 'felipe.caceraghi@gofurthergroup.com.br' };
            const generateResponse = await axios.post(`${API_BASE_URL}/api/xlsx-generator/generate-dual`, requestBody, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' } });
            if (!generateResponse.data.success) throw new Error(generateResponse.data.error || 'Erro ao gerar planilhas');
            const planilhas = generateResponse.data.data.planilhas || [];
            for (const planilha of planilhas) {
              const downloadResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`, { headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }, responseType: 'blob' });
              const blob = new Blob([downloadResponse.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = planilha.fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
            }
            setSpreadsheetFiles({ ...generateResponse.data.data, geradoEm: generateResponse.data.data.geradoEm || new Date().toISOString() });
            const tiposNomes = (generateResponse.data.data.planilhas || []).map(p => p.tipo === 'entrada' ? 'Entrada' : 'Honorários').join(' e ');
            const itemType = selectedItem?.type === 'nome' ? 'empresa' : 'grupo';
            toast.success(`Planilhas de ${tiposNomes} baixadas para ${itemType} ${searchValue} - ${generateResponse.data.data.empresas} empresas! Verifique sua pasta de Downloads.`);
            setSearchTerm(''); setSelectedItem(null);
          }

        } else {
          // Saída
          if (isEmpresaIndividual) {
            // Para empresa individual, usar endpoint específico
            const generateResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/generate-saida-cliente/${selectedItem.codigo}`, { headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' } });
            if (!generateResponse.data.success) throw new Error(generateResponse.data.error || 'Erro ao gerar planilha de saída');
            const planilha = generateResponse.data.data;
            const downloadResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`, { headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }, responseType: 'blob' });
            const blob = new Blob([downloadResponse.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = planilha.fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
            setSpreadsheetFiles({ planilhas: [{ fileName: planilha.fileName, tipo: 'saida' }], grupo: searchValue, empresas: 1, geradoEm: new Date().toISOString() });
            toast.success(`Planilha de Saída baixada para empresa ${searchValue}. Verifique sua pasta de Downloads.`);
            setSearchTerm(''); setSelectedItem(null);
          } else {
            // Para grupo, manter comportamento atual
            const generateResponse = await axios.post(`${API_BASE_URL}/api/xlsx-saida/grupo`, { grupo: searchValue }, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' } });
            if (!generateResponse.data.success) throw new Error(generateResponse.data.error || 'Erro ao gerar planilhas de saída');
            const data = generateResponse.data.data; const planilhas = data.planilhas || [];
            for (const planilha of planilhas) {
              const downloadResponse = await axios.get(`${API_BASE_URL}/api/xlsx-generator/download/${planilha.fileName}`, { headers: { 'Authorization': `Bearer ${token}`, 'bypass-tunnel-reminder': 'true', 'User-Agent': 'FluxoClienteCS/1.0' }, responseType: 'blob' });
              const blob = new Blob([downloadResponse.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = planilha.fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
            }
            setSpreadsheetFiles({ planilhas: planilhas.map(p => ({ fileName: p.fileName, tipo: p.tipo })), grupo: searchValue, empresas: data.empresas || 0, geradoEm: new Date().toISOString() });
            toast.success(`Planilhas de Saída baixadas para grupo ${searchValue}. Verifique sua pasta de Downloads.`);
            setSearchTerm(''); setSelectedItem(null);
          }
        }
      }

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      if (error.response?.status === 404) {
        const searchValue = selectedClients.length > 0 ? `${selectedClients.length} empresas` : (selectedItem?.type === 'nome' ? 'Empresa' : 'Grupo') + ` "${getSelectedValue()}"`;
        toast.error(`${searchValue} não encontrado`);
      }
      else if (error.response?.status === 400) { 
        const errorMsg = error.response?.data?.error || 'Dados inválidos para a seleção'; 
        const searchValue = selectedClients.length > 0 ? `${selectedClients.length} empresas` : (selectedItem?.type === 'nome' ? 'Empresa' : 'Grupo') + ` "${getSelectedValue()}"`;
        toast.error(`${errorMsg} (${searchValue})`); 
      }
      else toast.error('Erro ao gerar planilhas');
    } finally { setGenerating(false); }
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
            Pesquise por <strong>grupo</strong>, <strong>cliente individual</strong> ou <strong>selecione múltiplos clientes</strong> para gerar as planilhas de entrada e honorários
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
                placeholder="Digite um grupo ou nome de empresa..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onFocus={() => {
                  // Só mostra dropdown se ainda não tem item selecionado e não é mudança programática
                  if (!selectedItem && autocompleteResults.length > 0 && !isSelectingRef.current) {
                    setShowDropdown(true);
                  }
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  selectedItem ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
              {!loading && autocompleteResults.length > 0 && (
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              {selectedItem && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Dropdown de Sugestões */}
            {showDropdown && autocompleteResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {autocompleteResults.map((item, index) => (
                  <button
                    key={index}
                    onMouseDown={(e) => {
                      // Previne que o onBlur do input seja chamado antes do onClick
                      e.preventDefault();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemSelect(item);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 focus:bg-primary-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center">
                      {item.type === 'grupo' ? (
                        <Users className="w-4 h-4 text-blue-500 mr-3" />
                      ) : (
                        <Building2 className="w-4 h-4 text-green-500 mr-3" />
                      )}
                      <div className="flex-1">
                        <span className="text-gray-900 font-medium">{item.value}</span>
                        <div className="text-sm text-gray-500">
                          {item.type === 'grupo' ? `${item.count} empresa${item.count > 1 ? 's' : ''}` : `Cód: ${item.codigo}`}
                        </div>
                      </div>
                      {selectedItem?.value === item.value && (
                        <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Mensagem quando não encontrar resultados */}
            {showDropdown && searchTerm.trim().length >= 2 && autocompleteResults.length === 0 && !loading && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <div className="flex items-center text-gray-500">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Nenhum grupo ou empresa encontrado para "{searchTerm}"</span>
                </div>
              </div>
            )}
          </div>

          {/* Clientes Selecionados (Múltipla Seleção) */}
          {selectedClients.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  Clientes Selecionados ({selectedClients.length})
                </h4>
                <button
                  onClick={clearSelection}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Limpar tudo
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedClients.map((client) => (
                  <div
                    key={client.value}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    <Building2 className="w-3 h-3 mr-1" />
                    <span className="font-medium">{client.value}</span>
                    <span className="text-blue-600 ml-1">(Cód: {client.codigo})</span>
                    <button
                      onClick={() => removeClientFromSelection(client.value)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  {selectedClients.length > 0 
                    ? `Gerar Planilhas (${selectedClients.length} empresa${selectedClients.length > 1 ? 's' : ''})`
                    : !isValidSelection() 
                      ? 'Selecione um grupo ou empresa primeiro'
                      : 'Gerar Planilhas'
                  }
                </span>
              </>
            )}
          </button>

          {/* Status da Seleção */}
          {(searchTerm || selectedClients.length > 0) && (
            <div className="text-center text-sm">
              {selectedClients.length > 0 ? (
                <span className="text-green-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <Users className="w-4 h-4 mr-1" />
                  {selectedClients.length} empresa{selectedClients.length > 1 ? 's' : ''} selecionada{selectedClients.length > 1 ? 's' : ''} para geração múltipla
                </span>
              ) : selectedItem ? (
                <span className="text-green-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {selectedItem.type === 'grupo' ? (
                    <>
                      <Users className="w-4 h-4 mr-1" />
                      Grupo selecionado: <strong className="ml-1">{selectedItem.value}</strong>
                      <span className="text-gray-500 ml-1">({selectedItem.count} empresa{selectedItem.count > 1 ? 's' : ''})</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4 mr-1" />
                      Empresa selecionada: <strong className="ml-1">{selectedItem.value}</strong>
                      <span className="text-gray-500 ml-1">(Cód: {selectedItem.codigo})</span>
                    </>
                  )}
                </span>
              ) : isValidSelection() ? (
                <span className="text-green-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <Users className="w-4 h-4 mr-1" />
                  Grupo válido detectado: <strong className="ml-1">{searchTerm}</strong>
                </span>
              ) : (
                <span className="text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Digite e selecione um grupo ou empresa válido
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
              <li>• Digite pelo menos 2 caracteres para pesquisar grupos ou empresas</li>
              <li>• <Users className="inline w-4 h-4 text-blue-500" /> Grupos aparecem com ícone de pessoas e mostram quantas empresas</li>
              <li>• <Building2 className="inline w-4 h-4 text-green-500" /> Empresas aparecem com ícone de prédio e código</li>
              <li>• Clique na opção desejada na lista suspensa para <strong>adicionar à seleção</strong></li>
              <li>• Você pode selecionar <strong>múltiplas empresas</strong> para gerar uma planilha combinada</li>
              <li>• Os clientes selecionados aparecem como tags azuis abaixo do campo de pesquisa</li>
              <li>• Clique no X em cada tag para remover um cliente da seleção</li>
              <li>• Use "Limpar tudo" para remover todos os clientes selecionados</li>
              <li>• O campo ficará verde quando uma seleção válida for feita</li>
              <li>• Para <strong>grupos</strong>: gera planilhas com todas as empresas do grupo</li>
              <li>• Para <strong>empresas individuais</strong>: gera planilha específica para aquele cliente</li>
              <li>• Para <strong>múltiplas empresas</strong>: gera planilhas combinadas para todos os clientes selecionados</li>
              <li>• Clique em "Gerar Planilhas" para criar automaticamente as planilhas apropriadas</li>
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
                📊 Validar Planilhas Geradas {spreadsheetFiles.isMultiSelection ? '(Múltipla)' : ''}
              </h3>
              <button
                onClick={() => {
                  setSpreadsheetFiles(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {spreadsheetFiles.isMultiSelection ? 'Informações da Geração Múltipla' : 'Informações do Grupo'}
                </h4>
                {spreadsheetFiles.isMultiSelection ? (
                  <>
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Tipo:</strong> Múltiplas Empresas
                    </p>
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Empresas selecionadas:</strong> {spreadsheetFiles.selectedClients?.length || spreadsheetFiles.empresas}
                    </p>
                    <div className="text-sm text-blue-800 mb-1">
                      <strong>Empresas:</strong>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {spreadsheetFiles.selectedClients?.map((client, index) => (
                          <span key={index} className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">
                            {client.value} (Cód: {client.codigo})
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Grupo:</strong> {spreadsheetFiles.grupo}
                    </p>
                    <p className="text-sm text-blue-800 mb-1">
                      <strong>Empresas encontradas:</strong> {spreadsheetFiles.empresas}
                    </p>
                  </>
                )}
                <p className="text-sm text-blue-800">
                  <strong>Gerado em:</strong> {new Date(spreadsheetFiles.geradoEm).toLocaleString('pt-BR')}
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
