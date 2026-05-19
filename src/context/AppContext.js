// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginApi, registerApi,
  loginLocal, registerLocal,
  clearToken, getToken, getSavedUser,
  LOCAL_PRODUCTS, apiFetch, checkBackendOnline,
} from '../services/api';

const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [count, setCount]         = useState(0);
  const [orders, setOrders]       = useState([]);

  // ── Inicialização ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [online, token] = await Promise.all([
          checkBackendOnline(),
          getToken(),
        ]);
        setApiOnline(online);

        if (token) {
          if (online) {
            try {
              const r = await apiFetch('/auth/me');
              if (r?.user) { setUser(r.user); }
            } catch {
              const saved = await getSavedUser();
              if (saved) setUser(saved);
            }
          } else {
            const saved = await getSavedUser();
            if (saved) setUser(saved);
          }
        }
      } catch (e) {
        console.log('Init error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sincronizar badge do carrinho
  useEffect(() => {
    setCount(cartItems.reduce((s, i) => s + (i.qty || 1), 0));
  }, [cartItems]);

  // ── Auth ──────────────────────────────────────────────────
  // login(email, password) → { success, message }
  const login = useCallback(async (email, password) => {
    try {
      const res = apiOnline
        ? await loginApi({ email, password })
        : await loginLocal({ email, password });
      setUser(res.user);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [apiOnline]);

  // AuthScreen chama: register(name, email, password, phone)
  const register = useCallback(async (name, email, password, phone) => {
    try {
      const res = apiOnline
        ? await registerApi({ name, email, password, phone })
        : await registerLocal({ name, email, password, phone });
      setUser(res.user);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, [apiOnline]);

  const logout = useCallback(async () => {
    if (apiOnline) {
      try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    }
    await clearToken();
    setUser(null);
    setCartItems([]);
    setCount(0);
  }, [apiOnline]);

  // ── Carrinho helpers ──────────────────────────────────────
  const _loadCartFromApi = useCallback(async () => {
    try {
      const r = await apiFetch('/cart');
      if (r?.items) {
        const normalized = r.items.map(i => ({ ...i, id: i.productId }));
        setCartItems(normalized);
        setCount(r.totalItems || 0);
      }
    } catch {}
  }, []);

  const refreshCartCount = useCallback(async () => {
    if (apiOnline) await _loadCartFromApi();
    else setCount(cartItems.reduce((s, i) => s + (i.qty || 1), 0));
  }, [apiOnline, cartItems, _loadCartFromApi]);

  // addToCart(productId, qty) — telas passam apenas o ID (numérico)
  const addToCart = useCallback(async (productId, qty = 1) => {
    if (apiOnline) {
      try {
        await apiFetch('/cart', { method: 'POST', body: { productId, qty } });
        await _loadCartFromApi();
        return;
      } catch (e) { console.log('addToCart err:', e.message); }
    }
    const product = LOCAL_PRODUCTS.find(p => p.id === productId || p.id === Number(productId));
    if (!product) return;
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { ...product, qty }];
    });
  }, [apiOnline, _loadCartFromApi]);

  const removeFromCart = useCallback(async (productId) => {
    if (apiOnline) {
      try {
        await apiFetch(`/cart/${productId}`, { method: 'DELETE' });
        await _loadCartFromApi();
        return;
      } catch {}
    }
    setCartItems(prev => prev.filter(i => i.id !== productId));
  }, [apiOnline, _loadCartFromApi]);

  const updateCartQty = useCallback(async (productId, qty) => {
    if (qty <= 0) { await removeFromCart(productId); return; }
    if (apiOnline) {
      try {
        await apiFetch(`/cart/${productId}`, { method: 'PUT', body: { qty } });
        await _loadCartFromApi();
        return;
      } catch {}
    }
    setCartItems(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
  }, [apiOnline, removeFromCart, _loadCartFromApi]);

  const clearCart = useCallback(async () => {
    if (apiOnline) {
      try { await apiFetch('/cart', { method: 'DELETE' }); } catch {}
    }
    setCartItems([]);
    setCount(0);
  }, [apiOnline]);

  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  // ── Pedidos ───────────────────────────────────────────────
  const placeOrder = useCallback(async (payment = 'cartão', address = 'Endereço principal') => {
    if (apiOnline) {
      const r = await apiFetch('/orders', { method: 'POST', body: { payment, address } });
      if (r?.success && r.order) {
        setOrders(prev => [r.order, ...prev]);
        setCartItems([]);
        setCount(0);
        // Atualizar stats locais do usuário
        setUser(prev => prev ? {
          ...prev,
          stats: {
            orders:     (prev.stats?.orders     || 0) + 1,
            totalSpent: (prev.stats?.totalSpent || 0) + r.order.total,
            points:     (prev.stats?.points     || 0) + Math.floor(r.order.total / 10),
          },
        } : prev);
      }
      return r;
    }
    // Offline
    if (!cartItems.length) throw new Error('Carrinho vazio.');
    const order = {
      orderId: `ASR-${Date.now()}`,
      items: [...cartItems],
      total: cartTotal,
      createdAt: new Date().toISOString(),
      status: 'confirmado',
    };
    setOrders(prev => [order, ...prev]);
    setCartItems([]);
    setCount(0);
    return { success: true, order };
  }, [apiOnline, cartItems, cartTotal]);

  return (
    <AppContext.Provider value={{
      // Auth
      user, loading, setUser,
      login, register, logout,

      // Status da API
      apiOnline,

      // Catálogo
      products: LOCAL_PRODUCTS,

      // Carrinho (nomes compatíveis com TODAS as telas)
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