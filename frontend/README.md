# FluxoClienteCS - Frontend

Frontend em Next.js para o sistema FluxoClienteCS.

## 🚀 Funcionalidades

- ✅ **Autenticação JWT** com login/logout
- ✅ **Recuperação de senha** via email
- ✅ **Dashboard** com estatísticas
- ✅ **Layout responsivo** com Tailwind CSS
- ✅ **Gerenciamento de estado** com Context API
- ✅ **Notificações** com react-hot-toast
- ✅ **Formulários** com react-hook-form
- ✅ **Ícones** com Lucide React

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente
Copie `.env.local` e configure:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

## 📱 Páginas Disponíveis

### Públicas
- `/` - Redirecionamento automático
- `/login` - Página de login com recuperação de senha
- `/reset-password` - Reset de senha com token

### Privadas (requerem autenticação)
- `/dashboard` - Dashboard principal

## 🔐 Sistema de Autenticação

### Login
- Email e senha obrigatórios
- Validação de formato de email
- Senha mínima de 6 caracteres
- Token JWT salvo em cookies seguros

### Recuperação de Senha
- Email de recuperação enviado via API
- Link com token temporário
- Validação de força da senha
- Requisitos: maiúscula, minúscula, número, 8+ chars

### Logout
- Limpeza de cookies e localStorage
- Redirecionamento automático para login

## 🎨 Interface

### Design System
- **Cores**: Azul primário com tons de cinza
- **Fonte**: Inter (Google Fonts)
- **Componentes**: Tailwind CSS utilitário
- **Ícones**: Lucide React

### Componentes Principais
- `Layout` - Wrapper principal com auth
- `AuthContext` - Gerenciamento de estado global
- `AuthService` - Comunicação com API

## 🔄 Fluxo de Autenticação

1. **Inicialização**: Verifica token salvo
2. **Login**: Autentica e salva dados
3. **Proteção**: Rotas privadas verificam auth
4. **Renovação**: Token validado automaticamente
5. **Logout**: Limpeza e redirecionamento

## 📡 Integração com Backend

### Endpoints Utilizados
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Resetar senha
- `GET /api/auth/validate` - Validar token
- `GET /api/auth/me` - Dados do usuário

### Interceptadores Axios
- **Request**: Adiciona token automaticamente
- **Response**: Trata erros 401 (logout automático)

## 🛠️ Desenvolvimento

### Estrutura de Pastas
```
frontend/
├── components/     # Componentes reutilizáveis
├── context/        # Context providers
├── lib/           # Utilitários e serviços
├── pages/         # Páginas do Next.js
├── styles/        # Estilos globais
└── public/        # Arquivos estáticos
```

### Scripts Disponíveis
- `npm run dev` - Desenvolvimento (localhost:3000)
- `npm run build` - Build produção
- `npm run start` - Servidor produção
- `npm run lint` - ESLint

## 🔮 Próximos Passos

1. **Páginas de Gestão**:
   - Lista de empresas
   - Geração de relatórios
   - Configurações

2. **Funcionalidades**:
   - Upload de arquivos
   - Filtros avançados
   - Exportação de dados

3. **Melhorias**:
   - PWA (Progressive Web App)
   - Dark mode
   - Internacionalização

## 🐛 Troubleshooting

### Erro de Conexão
- Verifique se o backend está rodando na porta 3001
- Confirme as variáveis de ambiente

### Problemas de Autenticação
- Limpe cookies do navegador
- Verifique se o token não expirou

### Estilos não Aplicados
- Execute `npm run dev` para recompilar o Tailwind
- Verifique se PostCSS está configurado
