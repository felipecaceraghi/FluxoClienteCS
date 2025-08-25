import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function Users() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [stats, setStats] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // Filtros
    const [filters, setFilters] = useState({
        name: '',
        email: '',
        role: '',
        active: ''
    });

    // Formulário de novo usuário
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        active: true
    });

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
            return;
        }

        if (user && user.role === 'admin') {
            loadUsers();
            loadStats();
        }
    }, [user, loading, router]);

    useEffect(() => {
        applyFilters();
    }, [users, filters]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const token = localStorage.getItem('fluxoclientecs_token');
            const response = await axios.get(`${API_BASE_URL}/api/users?includeInactive=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('fluxoclientecs_token');
            const response = await axios.get(`${API_BASE_URL}/api/users/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    const applyFilters = () => {
        let filtered = users;

        if (filters.name) {
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        if (filters.email) {
            filtered = filtered.filter(user => 
                user.email.toLowerCase().includes(filters.email.toLowerCase())
            );
        }

        if (filters.role) {
            filtered = filtered.filter(user => user.role === filters.role);
        }

        if (filters.active !== '') {
            const isActive = filters.active === 'true';
            filtered = filtered.filter(user => user.active === isActive);
        }

        setFilteredUsers(filtered);
        setCurrentPage(1);
    };

    const createUser = async () => {
        try {
            const token = localStorage.getItem('fluxoclientecs_token');
            const response = await axios.post(`${API_BASE_URL}/api/users`, newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Usuário criado com sucesso!');
                setShowCreateModal(false);
                setNewUser({
                    name: '',
                    email: '',
                    password: '',
                    role: 'user',
                    active: true
                });
                loadUsers();
                loadStats();
            }
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao criar usuário');
        }
    };

    const updateUser = async () => {
        try {
            const token = localStorage.getItem('fluxoclientecs_token');
            const response = await axios.put(`${API_BASE_URL}/api/users/${editingUser.id}`, editingUser, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Usuário atualizado com sucesso!');
                setShowEditModal(false);
                setEditingUser(null);
                loadUsers();
            }
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('fluxoclientecs_token');
            const endpoint = currentStatus ? 'deactivate' : 'reactivate';
            
            const response = await axios.patch(`${API_BASE_URL}/api/users/${userId}/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success(response.data.message);
                loadUsers();
                loadStats();
            }
        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao alterar status');
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Tem certeza que deseja excluir este usuário permanentemente?')) {
            return;
        }

        try {
            const token = localStorage.getItem('fluxoclientecs_token');
            const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Usuário excluído com sucesso!');
                loadUsers();
                loadStats();
            }
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            toast.error(error.response?.data?.error || 'Erro ao excluir usuário');
        }
    };

    // Paginação
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
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
                                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Admin
                                </span>
                            </div>
                            
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Voltar ao Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
                            <p className="mt-1 text-gray-600">Administre os usuários do sistema</p>
                        </div>
                        <div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Novo Usuário
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-gray-600">Total de Usuários</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                            <div className="text-gray-600">Usuários Ativos</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                            <div className="text-gray-600">Usuários Inativos</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
                            <div className="text-gray-600">Administradores</div>
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Filtrar por nome"
                            value={filters.name}
                            onChange={(e) => setFilters({...filters, name: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Filtrar por email"
                            value={filters.email}
                            onChange={(e) => setFilters({...filters, email: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters({...filters, role: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas as roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                        <select
                            value={filters.active}
                            onChange={(e) => setFilters({...filters, active: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos os status</option>
                            <option value="true">Ativos</option>
                            <option value="false">Inativos</option>
                        </select>
                    </div>
                </div>

                {/* Tabela de Usuários */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Criado em
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loadingUsers ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center">
                                            Carregando usuários...
                                        </td>
                                    </tr>
                                ) : currentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                            Nenhum usuário encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((usr) => (
                                        <tr key={usr.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {usr.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {usr.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {usr.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    usr.role === 'admin' 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {usr.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    usr.active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {usr.active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(usr.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser({...usr});
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserStatus(usr.id, usr.active)}
                                                        className={usr.active ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                                                    >
                                                        {usr.active ? 'Desativar' : 'Ativar'}
                                                    </button>
                                                    {usr.id !== user.id && (
                                                        <button
                                                            onClick={() => deleteUser(usr.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Excluir
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Próximo
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Mostrando <span className="font-medium">{indexOfFirstUser + 1}</span> a{' '}
                                        <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> de{' '}
                                        <span className="font-medium">{filteredUsers.length}</span> resultados
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentPage(index + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    currentPage === index + 1
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Criar Usuário */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Usuário</h3>
                            
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Nome"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                <input
                                    type="password"
                                    placeholder="Senha"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={newUser.active}
                                        onChange={(e) => setNewUser({...newUser, active: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <label htmlFor="active" className="text-sm text-gray-700">
                                        Usuário ativo
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewUser({
                                            name: '',
                                            email: '',
                                            password: '',
                                            role: 'user',
                                            active: true
                                        });
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={createUser}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Criar Usuário
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar Usuário */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Usuário</h3>
                            
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Nome"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="editActive"
                                        checked={editingUser.active}
                                        onChange={(e) => setEditingUser({...editingUser, active: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <label htmlFor="editActive" className="text-sm text-gray-700">
                                        Usuário ativo
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={updateUser}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
