// src/screens/SearchScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { apiFetch, LOCAL_PRODUCTS, fmtPrice } from '../services/api';
import { useApp } from '../context/AppContext';

export default function SearchScreen({ navigation }) {
  const { apiOnline, addToCart, refreshCartCount } = useApp();
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState(LOCAL_PRODUCTS);
  const [loading, setLoad]  = useState(false);
  const [toast, setToast]   = useState(null);
  const timerRef            = useRef(null);
  const inputRef            = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleChange(val) {
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  }

  async function doSearch(q) {
    setLoad(true);
    if (apiOnline) {
      const path = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
      const r = await apiFetch(path);
      setResults(r?.results || LOCAL_PRODUCTS);
    } else {
      const ql = q.toLowerCase();
      setResults(q
        ? LOCAL_PRODUCTS.filter(p => p.name.toLowerCase().includes(ql) || p.brand.toLowerCase().includes(ql) || p.cat.toLowerCase().includes(ql))
        : LOCAL_PRODUCTS
      );
    }
    setLoad(false);
  }

  async function handleAdd(id) {
    await addToCart(id);
    await refreshCartCount();
    const p = results.find(x => x.id === id);
    showToast(`${p?.name?.split(' ').slice(0, 3).join(' ')} adicionado ✅`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Buscar peças, marcas, categorias..."
          placeholderTextColor={colors.text3}
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {!!query && (
          <TouchableOpacity onPress={() => { setQuery(''); doSearch(''); }}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results label */}
      <Text style={styles.label}>
        {query
          ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
          : 'Resultados populares'
        }
      </Text>

      {loading
        ? <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={results}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                activeOpacity={0.85}
              >
                <View style={styles.resultImg}>
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultBrand}>{item.brand} · {item.cat}</Text>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.resultPrice}>{fmtPrice(item.price)}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item.id)}>
                  <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>🔧</Text>
                <Text style={styles.emptyText}>Nenhum resultado encontrado.</Text>
              </View>
            }
          />
        )
      }

      {toast && (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg3, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: radius.md,
    margin: spacing.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, gap: 10,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  clearText: { color: colors.text3, fontSize: 16, padding: 4 },
  label: { fontSize: 12, color: colors.text3, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
  },
  resultImg: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: colors.bg4, alignItems: 'center', justifyContent: 'center',
  },
  resultBrand: { fontSize: 10, color: colors.orange, fontWeight: '600' },
  resultName: { fontSize: 14, fontWeight: '600', color: colors.text, marginVertical: 2 },
  resultPrice: { fontSize: 14, fontWeight: '700', color: colors.orange },
  addBtn: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.text3 },
  toast: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    backgroundColor: colors.bg4, borderRadius: radius.md,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  toastText: { color: colors.text, fontSize: 14, fontWeight: '500' },
});
