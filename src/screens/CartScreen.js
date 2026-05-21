// src/screens/CartScreen.js
import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';
import { fmtPrice } from '../services/api';
import { useApp } from '../context/AppContext';

export default function CartScreen({ navigation }) {
  const { cartItems, cartTotal, removeFromCart, updateCartQty, clearCart, placeOrder } = useApp();

  const frete      = cartTotal >= 150 ? 0 : 19.90;
  const grandTotal = cartTotal + frete;
  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);

  async function handleClear() {
    Alert.alert('Limpar Carrinho', 'Remover todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: clearCart },
    ]);
  }

  async function handleCheckout() {
    Alert.alert('Confirmar Pedido', `Total: ${fmtPrice(grandTotal)}\nDeseja finalizar?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        try {
          const r = await placeOrder();
          if (r?.success) {
            Alert.alert('✅ Pedido Realizado!', `Pedido ${r.order?.orderId} confirmado!`);
          }
        } catch (e) {
          Alert.alert('Erro', e.message);
        }
      }},
    ]);
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 64 }}>🛒</Text>
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptyDesc}>Adicione produtos para começar</Text>
        <Button
          title="Ver Produtos"
          onPress={() => navigation.navigate('Products')}
          style={styles.emptyBtn}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={cartItems}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearBtn}>🗑️ Limpar</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemEmoji}>
              <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemPrice}>{fmtPrice(item.price)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateCartQty(item.id, item.qty - 1)}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{item.qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateCartQty(item.id, item.qty + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{fmtPrice(cartTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete</Text>
              <Text style={[styles.summaryValue, frete === 0 && { color: colors.success }]}>
                {frete === 0 ? 'Grátis 🎉' : fmtPrice(frete)}
              </Text>
            </View>
            {frete > 0 && (
              <Text style={styles.freightHint}>Frete grátis acima de R$ 150,00</Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{fmtPrice(grandTotal)}</Text>
            </View>
          </View>
        }
      />

      <View style={styles.footer}>
        <Button title="Finalizar Compra" onPress={handleCheckout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.md, padding: spacing.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  emptyDesc:  { fontSize: 14, color: colors.text3 },
  emptyBtn:   { width: '100%', marginTop: spacing.sm },
  list:       { padding: spacing.md, gap: spacing.sm },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  clearBtn:    { fontSize: 13, color: colors.error, fontWeight: '500' },
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
  itemName:  { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, color: colors.orange, fontWeight: '700' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg4, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  qtyBtn:     { paddingHorizontal: 10, paddingVertical: 8 },
  qtyBtnText: { fontSize: 18, color: colors.orange, fontWeight: '700' },
  qtyNum:     { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },
  summary: {
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginTop: spacing.md, gap: spacing.sm,
  },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:{ fontSize: 14, color: colors.text2 },
  summaryValue:{ fontSize: 14, fontWeight: '600', color: colors.text },
  freightHint: { fontSize: 11, color: colors.text3, fontStyle: 'italic' },
  totalRow:    { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel:  { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue:  { fontSize: 22, fontWeight: '800', color: colors.orange },
  footer: {
    padding: spacing.md, paddingBottom: spacing.lg,
    backgroundColor: colors.bg2, borderTopWidth: 1, borderTopColor: colors.border,
  },
});