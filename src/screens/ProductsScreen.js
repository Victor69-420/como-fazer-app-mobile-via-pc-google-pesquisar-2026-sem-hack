// src/screens/ProductsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { ProductCard } from '../components';
import { apiFetch, LOCAL_PRODUCTS, CATEGORIES } from '../services/api';
import { useApp } from '../context/AppContext';

const SORTS = [
  { label: 'Relevância', value: '' },
  { label: 'Menor Preço', value: 'price_asc' },
  { label: 'Maior Preço', value: 'price_desc' },
  { label: 'Avaliação', value: 'rating' },
];

export default function ProductsScreen({ navigation, route }) {
  const { apiOnline, addToCart, refreshCartCount } = useApp();
  const initCat = route.params?.cat || 'Todos';
  const [cat, setCat]         = useState(initCat);
  const [sort, setSort]       = useState('');
  const [products, setProducts] = useState([]);
  const [refreshing, setRef]  = useState(false);
  const [toast, setToast]     = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const load = useCallback(async () => {
    if (apiOnline) {
      const params = new URLSearchParams();
      if (cat !== 'Todos') params.set('cat', cat);
      if (sort) params.set('sort', sort);
      const r = await apiFetch(`/products?${params}`);
      setProducts(r?.products || LOCAL_PRODUCTS);
    } else {
      let p = [...LOCAL_PRODUCTS];
      if (cat !== 'Todos') p = p.filter(x => x.cat === cat);
      if (sort === 'price_asc')  p.sort((a,b) => a.price - b.price);
      if (sort === 'price_desc') p.sort((a,b) => b.price - a.price);
      if (sort === 'rating')     p.sort((a,b) => b.rating - a.rating);
      setProducts(p);
    }
  }, [apiOnline, cat, sort]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(id) {
    await addToCart(id);
    await refreshCartCount();
    const p = products.find(x => x.id === id);
    showToast(`${p?.name?.split(' ').slice(0, 3).join(' ')} adicionado ✅`);
  }

  async function onRefresh() { setRef(true); await load(); setRef(false); }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsScroll}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={[styles.catChip, cat === c && styles.catChipActive]} onPress={() => setCat(c)}>
            <Text style={[styles.catChipText, cat === c && styles.catChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortsScroll}>
        {SORTS.map(s => (
          <TouchableOpacity key={s.value} style={[styles.sortChip, sort === s.value && styles.sortChipActive]} onPress={() => setSort(s.value)}>
            <Text style={[styles.sortChipText, sort === s.value && styles.sortChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.count}>{products.length} produto{products.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={products}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
            onAddToCart={() => handleAdd(item.id)}
          />
        )}
      />

      {toast && (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catsScroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.sm, backgroundColor: colors.bg3,
    borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm,
  },
  catChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  catChipText: { fontSize: 13, fontWeight: '500', color: colors.text2 },
  catChipTextActive: { color: '#fff', fontWeight: '700' },
  sortsScroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.sm, backgroundColor: colors.bg4,
    marginRight: spacing.sm,
  },
  sortChipActive: { backgroundColor: 'rgba(255,107,26,0.15)', borderWidth: 1, borderColor: colors.orange },
  sortChipText: { fontSize: 12, color: colors.text3 },
  sortChipTextActive: { color: colors.orange, fontWeight: '600' },
  count: { fontSize: 12, color: colors.text3, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  toast: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    backgroundColor: colors.bg4, borderRadius: radius.md,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  toastText: { color: colors.text, fontSize: 14, fontWeight: '500' },
});
