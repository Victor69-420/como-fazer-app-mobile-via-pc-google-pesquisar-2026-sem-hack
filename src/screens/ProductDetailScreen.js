// src/screens/ProductDetailScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';
import { fmtPrice } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart, refreshCartCount } = useApp();
  const [qty, setQty]     = useState(1);
  const [fav, setFav]     = useState(false);
  const [loading, setLoad] = useState(false);

  async function handleAdd() {
    setLoad(true);
    await addToCart(product.id, qty);
    await refreshCartCount();
    setLoad(false);
    Alert.alert('✅ Adicionado!', `${product.name} foi adicionado ao carrinho.`, [
      { text: 'Continuar', style: 'cancel' },
      { text: 'Ver Carrinho', onPress: () => navigation.navigate('Cart') },
    ]);
  }

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product image area */}
        <View style={styles.imageArea}>
          <Text style={styles.bigEmoji}>{product.emoji}</Text>
          {!!product.badge && (
            <View style={[styles.badge, product.badge === 'Novo' ? styles.badgeNew : styles.badgeSale]}>
              <Text style={styles.badgeText}>{product.badge}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.favBtn} onPress={() => setFav(v => !v)}>
            <Text style={{ fontSize: 24 }}>{fav ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.brand}>{product.brand} · {product.cat}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={{ color: i <= Math.round(product.rating) ? '#FFB800' : colors.bg4, fontSize: 16 }}>★</Text>
            ))}
            <Text style={styles.ratingText}>{product.rating} ({product.reviews} avaliações)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceBlock}>
            {product.oldPrice && (
              <View style={styles.priceRow}>
                <Text style={styles.oldPrice}>{fmtPrice(product.oldPrice)}</Text>
                <View style={styles.discountTag}>
                  <Text style={styles.discountText}>−{discount}%</Text>
                </View>
              </View>
            )}
            <Text style={styles.price}>{fmtPrice(product.price)}</Text>
            {product.oldPrice && (
              <Text style={styles.saving}>Você economiza {fmtPrice(product.oldPrice - product.price)}</Text>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descBlock}>
              <Text style={styles.descTitle}>Descrição</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          )}

          {/* Stock */}
          <View style={styles.stockRow}>
            <Text style={styles.stockDot}>●</Text>
            <Text style={styles.stockText}>
              {product.stock > 10 ? 'Em estoque' : product.stock > 0 ? `Apenas ${product.stock} disponíveis` : 'Indisponível'}
            </Text>
          </View>

          {/* Qty */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantidade</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>{fmtPrice(product.price * qty)}</Text>
        </View>
        <Button
          title="Adicionar ao Carrinho"
          onPress={handleAdd}
          loading={loading}
          style={styles.addBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageArea: {
    height: 240, backgroundColor: colors.bg3,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  bigEmoji: { fontSize: 90 },
  badge: {
    position: 'absolute', top: 16, left: 16,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  badgeSale: { backgroundColor: colors.orange },
  badgeNew:  { backgroundColor: colors.success },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  favBtn: { position: 'absolute', top: 16, right: 16 },
  details: { padding: spacing.md, gap: spacing.md },
  brand: { fontSize: 12, color: colors.orange, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: colors.text2, marginLeft: 6 },
  priceBlock: {
    backgroundColor: colors.bg3, borderRadius: radius.md,
    padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.border,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  oldPrice: { fontSize: 14, color: colors.text3, textDecorationLine: 'line-through' },
  discountTag: {
    backgroundColor: 'rgba(255,107,26,0.15)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  discountText: { color: colors.orange, fontSize: 12, fontWeight: '700' },
  price: { fontSize: 30, fontWeight: '800', color: colors.orange },
  saving: { fontSize: 12, color: colors.success },
  descBlock: { gap: 8 },
  descTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  desc: { fontSize: 14, color: colors.text2, lineHeight: 21 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockDot: { color: colors.success, fontSize: 10 },
  stockText: { fontSize: 13, color: colors.success, fontWeight: '500' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg3, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  qtyBtn: { padding: 10 },
  qtyBtnText: { fontSize: 22, color: colors.orange, fontWeight: '700' },
  qtyNum: { fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 30, textAlign: 'center' },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, paddingBottom: spacing.lg,
    backgroundColor: colors.bg2,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerLabel: { fontSize: 11, color: colors.text3 },
  footerPrice: { fontSize: 20, fontWeight: '800', color: colors.orange },
  addBtn: { flex: 1, marginLeft: spacing.md },
});
