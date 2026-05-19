// src/screens/CartScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';
import { apiFetch, fmtPrice } from '../services/api';
import { useApp } from '../context/AppContext';

export default function CartScreen({ navigation }) {
  const { user, apiOnline, cartItems, setCart, setCount } = useApp();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (apiOnline && user) {
      const r = await apiFetch('/cart');
      if (r?.success) setCartData(r);
    } else {
      const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
      const frete = total >= 150 ? 0 : 19.90;
      setCartData({ items: cartItems, total, frete, grandTotal: total + frete, totalItems: cartItems.reduce((s,i)=>s+i.qty,0) });
    }
    setLoading(false);
  }, [apiOnline, user, cartItems]);

  useEffect(() => { load(); }, [load]);

  async function changeQty(productId, delta) {
    if (apiOnline && user) {
      const item = cartData?.items?.find(i => (i.productId || i.id) === productId);
      if (!item) return;
      const newQty = item.qty + delta;
      if (newQty <= 0) await apiFetch(`/cart/${productId}`, { method: 'DELETE' });
      else             await apiFetch(`/cart/${productId}`, { method: 'PUT', body: { qty: newQty } });
    } else {
      setCart(prev => {
        const next = prev.map(i => i.id === productId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0);
        setCount(next.reduce((s,i) => s+i.qty, 0));
        return next;
      });
    }
    await load();
  }

  async function clearCart() {
    Alert.alert('Limpar Carrinho', 'Tem certeza que deseja remover todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => {
        if (apiOnline && user) await apiFetch('/cart', { method: 'DELETE' });
        else { setCart([]); setCount(0); }
        await load();
      }},
    ]);
  }

  async function checkout() {
    Alert.alert('Confirmar Pedido', 'Deseja finalizar a compra?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        if (apiOnline && user) {
          const r = await apiFetch('/orders', { method: 'POST', body: { payment: 'cartão', address: 'Endereço principal' } });
          if (r?.success) {
            Alert.alert('✅ Pedido Realizado!', `Pedido ${r.order?.orderId} confirmado!`);
            await load();
          } else Alert.alert('Erro', r?.message || 'Tente novamente.');
        } else {
          setCart([]); setCount(0);
          Alert.alert('✅ Pedido Realizado!', 'Seu pedido foi confirmado com sucesso!');
          await load();
        }
      }},
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.orange} /></View>;
  }

  const items = cartData?.items || [];

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 64 }}>🛒</Text>
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptyDesc}>Adicione produtos para começar</Text>
        <Button title="Ver Produtos" onPress={() => navigation.navigate('Products')} style={styles.emptyBtn} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.productId || i.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{cartData?.totalItems || 0} item{(cartData?.totalItems||0) !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearBtn}>🗑️ Limpar</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemEmoji}><Text style={{ fontSize: 32 }}>{item.emoji}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemPrice}>{fmtPrice(item.price)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.productId || item.id, -1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{item.qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.productId || item.id, +1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{fmtPrice(cartData?.total || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete</Text>
              <Text style={[styles.summaryValue, cartData?.frete === 0 && { color: colors.success }]}>
                {cartData?.frete === 0 ? 'Grátis 🎉' : fmtPrice(cartData?.frete || 0)}
              </Text>
            </View>
            {cartData?.frete > 0 && (
              <Text style={styles.freightHint}>Frete grátis acima de R$ 150,00</Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{fmtPrice(cartData?.grandTotal || 0)}</Text>
            </View>
          </View>
        }
      />

      <View style={styles.footer}>
        <Button title="Finalizar Compra" onPress={checkout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.text3 },
  emptyBtn: { width: '100%', marginTop: spacing.sm },
  list: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  clearBtn: { fontSize: 13, color: colors.error, fontWeight: '500' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
  },
  itemEmoji: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: colors.bg4, alignItems: 'center', justifyContent: 'center',
  },
  itemBrand: { fontSize: 10, color: colors.orange, fontWeight: '600', marginBottom: 2 },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, color: colors.orange, fontWeight: '700' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg4, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, color: colors.orange, fontWeight: '700' },
  qtyNum: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
  summary: {
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginTop: spacing.md, gap: spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: colors.text2 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  freightHint: { fontSize: 11, color: colors.text3, fontStyle: 'italic' },
  totalRow: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 22, fontWeight: '800', color: colors.orange },
  footer: {
    padding: spacing.md, paddingBottom: spacing.lg,
    backgroundColor: colors.bg2, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
