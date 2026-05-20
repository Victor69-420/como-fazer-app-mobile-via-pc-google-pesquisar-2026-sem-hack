// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  loginSupabase, registerSupabase, logoutSupabase, getSessionUser,
  getCartFromDb, upsertCartItem, deleteCartItem, clearCartDb,
  saveOrderDb, getOrdersDb,
  LOCAL_PRODUCTS,
} from '../services/api';

const AppContext = createContext({});
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders]   = useState([]);

  // "online" = Supabase está configurado com URL real
  const apiOnline = true;

  // ── Inicialização — restaurar sessão ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        const u = await getSessionUser();
        if (u) {
          setUser(u);
          await loadCart(u.id);
        }
      } catch (e) {
        console.log('Init error:', e.message);
      } finally {
        setLoading(false);
      }
    })();

    // Ouvir mudanças de sessão (ex: token expirado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setCartItems([]);
          setOrders([]);
        }
        if (event === 'SIGNED_IN' && session?.user) {
          const u = await getSessionUser();
          if (u) { setUser(u); await loadCart(u.id); }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Carrinho ──────────────────────────────────────────────
  async function loadCart(userId) {
    try {
      const items = await getCartFromDb(userId);
      setCartItems(items);
    } catch (e) {
      console.log('loadCart error:', e.message);
    }
  }

  const addToCart = useCallback(async (productId, qty = 1) => {
    if (!user) return;
    const product = LOCAL_PRODUCTS.find(p => p.id === productId || p.id === Number(productId));
    if (!product) return;

    // Otimismo: atualiza UI imediatamente
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty };
        return updated;
      }
      return [...prev, { ...product, qty }];
    });

    try {
      const existing = cartItems.find(i => i.id === product.id);
      const newQty = (existing?.qty || 0) + qty;
      await upsertCartItem(user.id, product.id, newQty);
    } catch (e) {
      console.log('addToCart error:', e.message);
      await loadCart(user.id); // reverter se falhou
    }
  }, [user, cartItems]);

  const removeFromCart = useCallback(async (productId) => {
    if (!user) return;
    setCartItems(prev => prev.filter(i => i.id !== productId));
    try { await deleteCartItem(user.id, productId); }
    catch { await loadCart(user.id); }
  }, [user]);

  const updateCartQty = useCallback(async (productId, qty) => {
    if (qty <= 0) { await removeFromCart(productId); return; }
    setCartItems(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
    try { await upsertCartItem(user.id, productId, qty); }
    catch { await loadCart(user.id); }
  }, [user, removeFromCart]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    if (user) {
      try { await clearCartDb(user.id); } catch {}
    }
  }, [user]);

  const cartCount = cartItems.reduce((s, i) => s + (i.qty || 1), 0);
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  const refreshCartCount = useCallback(async () => {
    if (user) await loadCart(user.id);
  }, [user]);

  // ── Pedidos ───────────────────────────────────────────────
  const placeOrder = useCallback(async (payment = 'cartão', address = 'Endereço principal') => {
    if (!cartItems.length) throw new Error('Carrinho vazio.');
    const order = {
      orderId:   `ASR-${Date.now()}`,
      items:     [...cartItems],
      total:     cartTotal,
      status:    'confirmado',
      payment,
      address,
      createdAt: new Date().toISOString(),
    };
    try {
      if (user) {
        await saveOrderDb(user.id, order);
        // Recarregar perfil para atualizar stats
        const updated = await getSessionUser();
        if (updated) setUser(updated);
      }
    } catch (e) {
      console.log('placeOrder error:', e.message);
    }
    setOrders(prev => [order, ...prev]);
    await clearCart();
    return { success: true, order };
  }, [user, cartItems, cartTotal, clearCart]);

  const loadOrders = useCallback(async () => {
    if (!user) return [];
    try {
      const data = await getOrdersDb(user.id);
      setOrders(data);
      return data;
    } catch (e) {
      console.log('loadOrders error:', e.message);
      return orders;
    }
  }, [user, orders]);

  // ── Auth ──────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const { user: u } = await loginSupabase({ email, password });
      setUser(u);
      await loadCart(u.id);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, []);

  // AuthScreen chama: register(name, email, password, phone)
  const register = useCallback(async (name, email, password, phone) => {
    try {
      const { user: u } = await registerSupabase({ name, email, password, phone });
      setUser(u);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutSupabase();
    setUser(null);
    setCartItems([]);
    setOrders([]);
  }, []);

  return (
    <AppContext.Provider value={{
      // Auth
      user, loading, setUser,
      login, register, logout,

      // Status
      apiOnline,

      // Catálogo
      products: LOCAL_PRODUCTS,

      // Carrinho
      cart: cartItems,
      cartItems,
      cartCount,
      cartTotal,
      setCart: setCartItems,
      setCount: () => {},
      addToCart,
      removeFromCart,
      updateCartQty,
      clearCart,
      refreshCartCount,

      // Pedidos
      orders,
      placeOrder,
      loadOrders,
    }}>
      {children}
    </AppContext.Provider>
  );
}