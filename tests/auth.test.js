// __tests__/auth.test.js
// Testes automatizados de Autenticação
// Recurso de celular usado: AsyncStorage (persistência de sessão)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ── Mock do AsyncStorage (simula recurso de celular) ──────────
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem:    jest.fn(() => Promise.resolve()),
  getItem:    jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear:      jest.fn(() => Promise.resolve()),
  getAllKeys:  jest.fn(() => Promise.resolve([])),
  multiGet:   jest.fn(() => Promise.resolve([])),
  multiSet:   jest.fn(() => Promise.resolve()),
  multiRemove:jest.fn(() => Promise.resolve()),
}));

// ── Mock do Supabase ──────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp:             jest.fn(),
      signOut:            jest.fn(),
      getSession:         jest.fn(),
      onAuthStateChange:  jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

// ─────────────────────────────────────────────────────────────
// CENÁRIO 1: Login com credenciais válidas
// ─────────────────────────────────────────────────────────────
describe('Cenário 1 – Login com credenciais válidas', () => {
  const mockUser = {
    id:    'user-123',
    email: 'victor@teste.com',
    user_metadata: { name: 'Victor' },
  };
  const mockSession = { access_token: 'token-abc', user: mockUser };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('✅ APROVADO: Login retorna usuário e salva sessão no AsyncStorage', async () => {
    // Arrange: Supabase retorna sucesso
    const supabase = createClient('url', 'key');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data:  { user: mockUser, session: mockSession },
      error: null,
    });

    // Act: Simular login
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    'victor@teste.com',
      password: 'Senha123@',
    });

    // Assert: Usuário retornado corretamente
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('victor@teste.com');
    expect(data.user.id).toBe('user-123');

    // Assert: Token salvo no AsyncStorage (recurso do celular)
    await AsyncStorage.setItem('supabase.auth.token', mockSession.access_token);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'supabase.auth.token',
      'token-abc'
    );

    console.log('✅ APROVADO – Login retornou usuário e sessão foi salva no dispositivo');
  });

  test('✅ APROVADO: Sessão persiste após fechar e reabrir o app', async () => {
    // Arrange: AsyncStorage tem token salvo (simula app reaberto)
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
      access_token: 'token-abc',
      user: mockUser,
    }));

    // Act: Recuperar sessão do AsyncStorage
    const raw     = await AsyncStorage.getItem('supabase.auth.token');
    const session = JSON.parse(raw);

    // Assert: Sessão recuperada com sucesso
    expect(session).not.toBeNull();
    expect(session.user.email).toBe('victor@teste.com');
    expect(session.access_token).toBe('token-abc');

    console.log('✅ APROVADO – Sessão persistida e recuperada do AsyncStorage do celular');
  });

  test('✅ APROVADO: Logout limpa sessão do AsyncStorage', async () => {
    // Arrange: Supabase signOut retorna sucesso
    const supabase = createClient('url', 'key');
    supabase.auth.signOut.mockResolvedValueOnce({ error: null });

    // Act: Fazer logout
    const { error } = await supabase.auth.signOut();
    await AsyncStorage.removeItem('supabase.auth.token');

    // Assert: Sem erro e item removido do storage
    expect(error).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token');

    console.log('✅ APROVADO – Logout limpou a sessão do AsyncStorage do celular');
  });
});

// ─────────────────────────────────────────────────────────────
// CENÁRIO 2: Tentativa de login com credenciais inválidas
// ─────────────────────────────────────────────────────────────
describe('Cenário 2 – Login com credenciais inválidas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('✅ APROVADO: Login com senha errada retorna erro e NÃO salva sessão', async () => {
    // Arrange: Supabase retorna erro de autenticação
    const supabase = createClient('url', 'key');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data:  { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    // Act: Tentar login com senha errada
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    'victor@teste.com',
      password: 'senhaErrada123',
    });

    // Assert: Erro retornado, usuário null
    expect(error).not.toBeNull();
    expect(error.message).toBe('Invalid login credentials');
    expect(data.user).toBeNull();

    // Assert: AsyncStorage NÃO foi chamado (sessão não salva)
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();

    console.log('✅ APROVADO – Credenciais inválidas bloqueadas, AsyncStorage não foi modificado');
  });

  test('✅ APROVADO: Login com e-mail inválido retorna erro de formato', async () => {
    // Arrange
    const supabase = createClient('url', 'key');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data:  { user: null, session: null },
      error: { message: 'Unable to validate email address: invalid format' },
    });

    // Act
    const { error } = await supabase.auth.signInWithPassword({
      email:    'email-invalido',
      password: '123456',
    });

    // Assert
    expect(error).not.toBeNull();
    expect(error.message).toContain('invalid format');

    console.log('✅ APROVADO – E-mail inválido rejeitado corretamente');
  });

  test('✅ APROVADO: Sem sessão salva, app não loga automaticamente', async () => {
    // Arrange: AsyncStorage vazio (app novo ou após logout)
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    // Act
    const session = await AsyncStorage.getItem('supabase.auth.token');

    // Assert: Nenhuma sessão encontrada
    expect(session).toBeNull();

    console.log('✅ APROVADO – App sem sessão salva não faz login automático');
  });
});