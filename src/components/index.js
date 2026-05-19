// src/components/index.js
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { colors, spacing, radius } from '../theme';

// ── Button ───────────────────────────────────────────────────
export function Button({ title, onPress, loading, variant = 'primary', style }) {
  const bg = variant === 'primary' ? colors.orange : colors.bg3;
  const tc = variant === 'primary' ? colors.white : colors.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      style={[styles.btn, { backgroundColor: bg }, style]}
    >
      {loading
        ? <ActivityIndicator color={tc} />
        : <Text style={[styles.btnText, { color: tc }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ── InputField ───────────────────────────────────────────────
export function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, error, rightElement }) {
  return (
    <View style={[styles.inputWrap, error && styles.inputError]}>
      {icon && <Text style={styles.inputIcon}>{icon}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
      {rightElement}
    </View>
  );
}

// ── ProductCard ──────────────────────────────────────────────
export function ProductCard({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.productEmoji}><Text style={styles.emojiText}>{product.emoji}</Text></View>
      {!!product.badge && (
        <View style={[styles.badge, product.badge === 'Novo' ? styles.badgeNew : styles.badgeSale]}>
          <Text style={styles.badgeText}>{product.badge}</Text>
        </View>
      )}
      <Text style={styles.productBrand}>{product.brand}</Text>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <View style={styles.ratingRow}>
        <Text style={styles.star}>★</Text>
        <Text style={styles.ratingText}>{product.rating} ({product.reviews})</Text>
      </View>
      <View style={styles.priceRow}>
        <View>
          {product.oldPrice && (
            <Text style={styles.oldPrice}>R$ {product.oldPrice.toFixed(2).replace('.', ',')}</Text>
          )}
          <Text style={styles.price}>R$ {product.price.toFixed(2).replace('.', ',')}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAddToCart}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── SectionHeader ────────────────────────────────────────────
export function SectionHeader({ title, linkText, onLink }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {linkText && (
        <TouchableOpacity onPress={onLink}>
          <Text style={styles.sectionLink}>{linkText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Avatar ───────────────────────────────────────────────────
export function Avatar({ initials, size = 40 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

// ── Toast (hook) ─────────────────────────────────────────────
export function Toast({ message, emoji, visible }) {
  if (!visible) return null;
  return (
    <View style={styles.toast}>
      <Text style={styles.toastText}>{emoji} {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputError: { borderColor: colors.error },
  inputIcon: { fontSize: 18 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'System',
  },
  productCard: {
    width: 164,
    backgroundColor: colors.bg3,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  productEmoji: {
    width: 56, height: 56,
    borderRadius: 14,
    backgroundColor: colors.bg4,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emojiText: { fontSize: 28 },
  badge: {
    position: 'absolute', top: 10, right: 10,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSale: { backgroundColor: colors.orange },
  badgeNew:  { backgroundColor: colors.success },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  productBrand: { fontSize: 10, color: colors.orange, fontWeight: '600', marginBottom: 2 },
  productName: { fontSize: 13, color: colors.text, fontWeight: '600', marginBottom: 6, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  star: { color: '#FFB800', fontSize: 11 },
  ratingText: { fontSize: 10, color: colors.text2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  oldPrice: { fontSize: 10, color: colors.text3, textDecorationLine: 'line-through' },
  price: { fontSize: 15, color: colors.orange, fontWeight: '700' },
  addBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  sectionLink: { fontSize: 13, color: colors.orange, fontWeight: '500' },
  avatar: {
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  toast: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: colors.bg4,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 999,
  },
  toastText: { color: colors.text, fontSize: 14, fontWeight: '500' },
});
