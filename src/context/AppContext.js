// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginLocal,
  registerLocal,
  clearToken,
  getToken,
  getSavedUser,
  LOCAL_PRODUCTS,
  LOCAL_CATEGORIES,
  apiFetch,
} from '../services/api';

const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [cart, setCart]         = useState([]);
  const [products, setProducts] = useState(LOCAL_PRODUCTS);
  const [categories, setCategories] = useState(LOCAL_CATEGORIES);
  const [orders, setOrders]     = useState([]);

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
  }, []);

  // ── Tentar carregar produtos da API (fallback já está no apiFetch) ──
  useEffect(() => {
    if (!user) return;
    apiFetch('/products')
      .then(data => { if (data?.products?.length) setProducts(data.products); })
      .catch(() => {}); // silencia, usa LOCAL_PRODUCTS
    apiFetch('/categories')
      .then(data => { if (data?.categories?.length) setCategories(data.categories); })
      .catch(() => {});
  }, [user]);

  // ── Auth ──────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { user: u } = await loginLocal({ email, password });
    setUser(u);
  }, []);

  const register = useCallback(async (name, email, phone, password) => {
    const { user: u } = await registerLocal({ name, email, phone, password });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    setCart([]);
  }, []);

  // ── Carrinho ──────────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { ...product, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateCartQty = useCallback((productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  // ── Pedidos ───────────────────────────────────────────────
  const placeOrder = useCallback(async () => {
    if (cart.length === 0) throw new Error('Carrinho vazio.');
    const newOrder = {
      id: `ord_${Date.now()}`,
      items: [...cart],
      total: cartTotal,
      date: new Date().toISOString(),
      status: 'Confirmado',
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  }, [cart, cartTotal, clearCart]);

  return (
    <AppContext.Provider value={{
      // Auth
      user, loading, login, register, logout,
      // Catálogo
      products, categories,
      // Carrinho
      cart, cartCount, cartTotal,
      addToCart, removeFromCart, updateCartQty, clearCart,
      // Pedidos
      orders, placeOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
}