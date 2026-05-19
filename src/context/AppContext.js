// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  loginLocal, registerLocal, clearToken,
  getToken, getSavedUser, LOCAL_PRODUCTS, apiFetch, API_BASE,
} from '../services/api';

const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  // Carrinho (cartItems = alias para cart para compatibilidade das telas)
  const [cartItems, setCartItems] = useState([]);
  const [count, setCount]         = useState(0);

  const products = LOCAL_PRODUCTS;

  // ── Checar se API está online ─────────────────────────────
  const checkApi = useCallback(async () => {
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 3000);
      const res  = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
      clearTimeout(tid);
      setApiOnline(res.ok);
    } catch {
      setApiOnline(false);
    }
  }, []);

  // ── Restaurar sessão ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const savedUser = await getSavedUser();
          if (savedUser) setUser(savedUser);
        }
      } catch (e) {
        console.log('Restore session error:', e);
      } finally {
        setLoading(false);
      }
    })();
    checkApi();
  }, []);

  // ── Atualizar contagem do carrinho ────────────────────────
  const refreshCartCount = useCallback(async () => {
    if (apiOnline && user) {
      try {
        const r = await apiFetch('/cart');
        setCount(r?.totalItems || 0);
      } catch { /* usa estado local */ }
    } else {
      setCount(cartItems.reduce((s, i) => s + i.qty, 0));
    }
  }, [apiOnline, user, cartItems]);

  useEffect(() => {
    setCount(cartItems.reduce((s, i) => s + i.qty, 0));
  }, [cartItems]);

  // ── Auth ──────────────────────────────────────────────────
  // login: retorna { success, message } para AuthScreen
  const login = useCallback(async (email, password) => {
    try {
      const { user: u } = await loginLocal({ email, password });
      setUser(u);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, []);

  // register: AuthScreen chama register(name, email, password, phone)
  const register = useCallback(async (name, email, password, phone) => {
    try {
      const { user: u } = await registerLocal({ name, email, phone, password });
      setUser(u);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    setCartItems([]);
    setCount(0);
  }, []);

  // ── Carrinho ──────────────────────────────────────────────
  // addToCart aceita (id, qty) ou (id) — telas passam apenas o id
  const addToCart = useCallback(async (productId, qty = 1) => {
    if (apiOnline && user) {
      try {
        await apiFetch('/cart', { method: 'POST', body: { productId, qty } });
        return;
      } catch { /* fallback local */ }
    }
    // Offline: adiciona pelo ID buscando o produto nos dados locais
    const product = LOCAL_PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === productId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { ...product, qty }];
    });
  }, [apiOnline, user]);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateCartQty = useCallback((productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCount(0);
  }, []);

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  // ── Pedidos ───────────────────────────────────────────────
  const [orders, setOrders] = useState([]);

  const placeOrder = useCallback(async () => {
    if (cartItems.length === 0) throw new Error('Carrinho vazio.');
    const newOrder = {
      orderId: `ASR-${Date.now()}`,
      items: [...cartItems],
      total: cartTotal,
      createdAt: new Date().toISOString(),
      status: 'Confirmado',
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return { success: true, order: newOrder };
  }, [cartItems, cartTotal, clearCart]);

  return (
    <AppContext.Provider value={{
      // Auth
      user, loading,
      login, register, logout,
      setUser,

      // API status
      apiOnline,

      // Catálogo
      products,

      // Carrinho — nomes compatíveis com todas as telas
      cart: cartItems,
      cartItems,
      cartCount: count,
      cartTotal,
      setCart: setCartItems,
      setCount,
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      refreshCartCount,

      // Pedidos
      orders,
      placeOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
}