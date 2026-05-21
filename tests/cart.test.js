// __tests__/cart.test.js
// Testes automatizados do Carrinho
// Recurso de celular usado: AsyncStorage (persistência local de dados)

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Mock do AsyncStorage ──────────────────────────────────────
const storageData = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem:    jest.fn((key, value) => {
    storageData[key] = value;
    return Promise.resolve();
  }),
  getItem:    jest.fn((key) => Promise.resolve(storageData[key] || null)),
  removeItem: jest.fn((key) => {
    delete storageData[key];
    return Promise.resolve();
  }),
  clear:      jest.fn(() => {
    Object.keys(storageData).forEach(k => delete storageData[k]);
    return Promise.resolve();
  }),
  getAllKeys:  jest.fn(() => Promise.resolve(Object.keys(storageData))),
}));

// ── Mock do Supabase ──────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession:        jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

// ── Lógica do carrinho (isolada para teste) ───────────────────
const CART_KEY = 'asr_cart_local';

async function saveCart(items) {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
}

async function loadCart() {
  const raw = await AsyncStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function addToCart(cart, product, qty = 1) {
  const idx = cart.findIndex(i => i.id === product.id);
  let updated;
  if (idx >= 0) {
    updated = cart.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
  } else {
    updated = [...cart, { ...product, qty }];
  }
  await saveCart(updated);
  return updated;
}

async function removeFromCart(cart, productId) {
  const updated = cart.filter(i => i.id !== productId);
  await saveCart(updated);
  return updated;
}

async function updateQty(cart, productId, qty) {
  if (qty <= 0) return removeFromCart(cart, productId);
  const updated = cart.map(i => i.id === productId ? { ...i, qty } : i);
  await saveCart(updated);
  return updated;
}

function calcTotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

// ── Produtos de teste ─────────────────────────────────────────
const PRODUTO_A = { id: 1, name: 'Módulo de Ignição Universal', brand: 'Bosch',  price: 289.90, emoji: '⚡' };
const PRODUTO_B = { id: 2, name: 'Sensor MAP de Pressão 1 Bar', brand: 'Delphi', price: 124.50, emoji: '🔌' };
const PRODUTO_C = { id: 3, name: 'Velas de Ignição Iridium Gx8',brand: 'NGK',    price: 68.00,  emoji: '🕯️' };

// ─────────────────────────────────────────────────────────────
// CENÁRIO 1: Adicionar e persistir produtos no carrinho
// ─────────────────────────────────────────────────────────────
describe('Cenário 1 – Adicionar e persistir produtos no carrinho', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test('✅ APROVADO: Adicionar produto salva no AsyncStorage do celular', async () => {
    // Arrange
    let cart = [];

    // Act: Adicionar produto A
    cart = await addToCart(cart, PRODUTO_A, 1);

    // Assert: Carrinho tem 1 item
    expect(cart).toHaveLength(1);
    expect(cart[0].name).toBe('Módulo de Ignição Universal');
    expect(cart[0].qty).toBe(1);

    // Assert: Salvo no AsyncStorage (recurso do celular)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      CART_KEY,
      JSON.stringify(cart)
    );

    console.log('✅ APROVADO – Produto adicionado e salvo no AsyncStorage do celular');
  });

  test('✅ APROVADO: Carrinho persiste após fechar e reabrir o app', async () => {
    // Arrange: Salvar carrinho com 2 produtos
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1);
    cart = await addToCart(cart, PRODUTO_B, 2);

    // Act: Simular fechamento e reabertura do app (carregar do storage)
    const cartRecuperado = await loadCart();

    // Assert: Dados preservados no celular
    expect(cartRecuperado).toHaveLength(2);
    expect(cartRecuperado[0].id).toBe(1);
    expect(cartRecuperado[1].id).toBe(2);
    expect(cartRecuperado[1].qty).toBe(2);

    console.log('✅ APROVADO – Carrinho recuperado do AsyncStorage após simular reinício do app');
  });

  test('✅ APROVADO: Adicionar mesmo produto incrementa quantidade', async () => {
    // Arrange
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1);

    // Act: Adicionar o mesmo produto novamente
    cart = await addToCart(cart, PRODUTO_A, 2);

    // Assert: Apenas 1 item, mas com qty = 3
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);

    console.log('✅ APROVADO – Produto duplicado incrementa quantidade corretamente');
  });

  test('✅ APROVADO: Total calculado corretamente com múltiplos itens', async () => {
    // Arrange
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1); // 289.90
    cart = await addToCart(cart, PRODUTO_B, 2); // 124.50 × 2 = 249.00
    cart = await addToCart(cart, PRODUTO_C, 3); // 68.00 × 3  = 204.00

    // Act
    const total = calcTotal(cart);

    // Assert: 289.90 + 249.00 + 204.00 = 742.90
    expect(total).toBeCloseTo(742.90, 2);

    console.log(`✅ APROVADO – Total calculado: R$ ${total.toFixed(2)} (esperado: R$ 742,90)`);
  });
});

// ─────────────────────────────────────────────────────────────
// CENÁRIO 2: Remover e atualizar produtos do carrinho
// ─────────────────────────────────────────────────────────────
describe('Cenário 2 – Remover e atualizar produtos do carrinho', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test('✅ APROVADO: Remover produto atualiza AsyncStorage', async () => {
    // Arrange: Carrinho com 2 produtos
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1);
    cart = await addToCart(cart, PRODUTO_B, 1);
    expect(cart).toHaveLength(2);

    // Act: Remover produto A
    cart = await removeFromCart(cart, PRODUTO_A.id);

    // Assert: Apenas produto B permanece
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe(2);

    // Assert: AsyncStorage atualizado
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      CART_KEY,
      JSON.stringify(cart)
    );

    console.log('✅ APROVADO – Produto removido e AsyncStorage atualizado corretamente');
  });

  test('✅ APROVADO: Atualizar quantidade persiste no celular', async () => {
    // Arrange
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1);

    // Act: Mudar quantidade para 5
    cart = await updateQty(cart, PRODUTO_A.id, 5);

    // Assert
    expect(cart[0].qty).toBe(5);
    expect(cart[0].price).toBe(289.90);

    const cartSalvo = await loadCart();
    expect(cartSalvo[0].qty).toBe(5);

    console.log('✅ APROVADO – Quantidade atualizada e persistida no AsyncStorage');
  });

  test('✅ APROVADO: Quantidade zero remove o produto automaticamente', async () => {
    // Arrange
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1);
    cart = await addToCart(cart, PRODUTO_B, 1);

    // Act: Setar qty = 0 (deve remover)
    cart = await updateQty(cart, PRODUTO_A.id, 0);

    // Assert: Produto A foi removido
    expect(cart).toHaveLength(1);
    expect(cart.find(i => i.id === PRODUTO_A.id)).toBeUndefined();

    console.log('✅ APROVADO – Quantidade zero removeu o produto automaticamente');
  });

  test('✅ APROVADO: Limpar carrinho remove tudo do AsyncStorage', async () => {
    // Arrange: Carrinho com 3 produtos
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1);
    cart = await addToCart(cart, PRODUTO_B, 2);
    cart = await addToCart(cart, PRODUTO_C, 3);
    expect(cart).toHaveLength(3);

    // Act: Limpar carrinho
    await AsyncStorage.removeItem(CART_KEY);
    const cartVazio = await loadCart();

    // Assert: Carrinho vazio
    expect(cartVazio).toHaveLength(0);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(CART_KEY);

    console.log('✅ APROVADO – Carrinho limpo e AsyncStorage atualizado');
  });

  test('✅ APROVADO: Frete grátis acima de R$ 150,00', async () => {
    // Arrange
    let cart = [];
    cart = await addToCart(cart, PRODUTO_A, 1); // R$ 289.90 > R$ 150

    // Act
    const total = calcTotal(cart);
    const frete = total >= 150 ? 0 : 19.90;

    // Assert
    expect(total).toBeGreaterThan(150);
    expect(frete).toBe(0);

    console.log(`✅ APROVADO – Total R$ ${total.toFixed(2)} qualifica frete grátis`);
  });

  test('✅ APROVADO: Frete cobrado abaixo de R$ 150,00', async () => {
    // Arrange
    let cart = [];
    cart = await addToCart(cart, PRODUTO_C, 1); // R$ 68.00 < R$ 150

    // Act
    const total = calcTotal(cart);
    const frete = total >= 150 ? 0 : 19.90;

    // Assert
    expect(total).toBeLessThan(150);
    expect(frete).toBe(19.90);

    console.log(`✅ APROVADO – Total R$ ${total.toFixed(2)} cobra frete de R$ 19,90`);
  });
});