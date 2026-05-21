// src/screens/HomeScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { SectionHeader, ProductCard, Avatar } from '../components';
import { LOCAL_PRODUCTS, fmtPrice } from '../services/api';
import { useApp } from '../context/AppContext';

export default function HomeScreen({ navigation }) {
  const { user, addToCart, refreshCartCount } = useApp();
  const [featured, setFeatured] = useState([]);
  const [newItems, setNew]      = useState([]);
  const [refreshing, setRef]    = useState(false);
  const [toast, setToast]       = useState(null);

  const initials = user?.name?.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const load = useCallback(() => {
    // Produtos em destaque = os que têm badge de desconto
    setFeatured(LOCAL_PRODUCTS.filter(p => p.badge && p.badge !== 'Novo').slice(0, 6));
    // Novidades = os que têm badge 'Novo'
    setNew(LOCAL_PRODUCTS.filter(p => p.badge === 'Novo').concat(
      LOCAL_PRODUCTS.filter(p => !p.badge).slice(0, 3)
    ).slice(0, 6));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(id) {
    await addToCart(id);
    await refreshCartCount();
    const p = LOCAL_PRODUCTS.find(x => x.id === id);
    showToast(`${p?.name?.split(' ').slice(0, 3).join(' ')} adicionado! ✅`);
  }

  async function onRefresh() {
    setRef(true);
    load();
    setRef(false);
  }

  const CATS = [
    { name: 'Elétrica', emoji: '⚡' }, { name: 'Motor', emoji: '⚙️' },
    { name: 'Iluminação', emoji: '💡' }, { name: 'Bateria', emoji: '🔋' },
    { name: 'Freios', emoji: '🛞' }, { name: 'Suspensão', emoji: '🔩' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orange} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSub}>AUTO PEÇAS</Text>
            <Text style={styles.brandName}>ASR Eletrônica</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar initials={initials} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Buscar peças, marcas...</Text>
          <View style={styles.filterBtn}><Text style={{ color: '#fff', fontSize: 14 }}>⚡</Text></View>
        </TouchableOpacity>

        {/* Banner */}
        <View style={styles.bannerWrap}>
          <View style={styles.banner}>
            <View style={styles.bannerTag}><Text style={styles.bannerTagText}>PROMOÇÃO DO DIA</Text></View>
            <Text style={styles.bannerTitle}>Até <Text style={{ color: colors.orange }}>22% OFF</Text>{'\n'}em módulos</Text>
            <Text style={styles.bannerDesc}>Peças eletrônicas premium com garantia de fábrica</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('Products')}>
              <Text style={styles.bannerBtnText}>Ver Ofertas →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader title="Categorias" linkText="Ver todas" onLink={() => navigation.navigate('Products')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.md }}>
            <View style={styles.catsRow}>
              {CATS.map(c => (
                <TouchableOpacity
                  key={c.name}
                  style={styles.catCard}
                  onPress={() => navigation.navigate('Products', { cat: c.name })}
                >
                  <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
                  <Text style={styles.catName}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Em Destaque */}
        <View style={styles.section}>
          <SectionHeader title="Em Destaque" linkText="Ver todos" onLink={() => navigation.navigate('Products')} />
          {featured.length > 0 ? (
            <FlatList
              horizontal
              data={featured}
              keyExtractor={i => String(i.id)}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  onAddToCart={() => handleAdd(item.id)}
                />
              )}
            />
          ) : (
            <Text style={styles.emptyText}>Nenhum produto em destaque</Text>
          )}
        </View>

        {/* Novidades */}
        <View style={[styles.section, { paddingBottom: 24 }]}>
          <SectionHeader title="Novidades" linkText="Ver todas" onLink={() => navigation.navigate('Products')} />
          {newItems.length > 0 ? (
            <FlatList
              horizontal
              data={newItems}
              keyExtractor={i => String(i.id)}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  onAddToCart={() => handleAdd(item.id)}
                />
              )}
            />
          ) : (
            <Text style={styles.emptyText}>Nenhuma novidade</Text>
          )}
        </View>
      </ScrollView>

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: spacing.md, paddingTop: spacing.sm,
  },
  brandSub:  { fontSize: 11, fontWeight: '600', color: colors.orange, letterSpacing: 2, textTransform: 'uppercase' },
  brandName: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, gap: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: colors.text3 },
  filterBtn: {
    width: 32, height: 32, backgroundColor: colors.orange,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  bannerWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  banner: {
    backgroundColor: colors.bg3, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.2)', minHeight: 160, justifyContent: 'flex-end',
  },
  bannerTag: {
    alignSelf: 'flex-start', backgroundColor: colors.orange,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  bannerTagText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  bannerTitle: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 28, marginBottom: 6 },
  bannerDesc:  { fontSize: 12, color: colors.text2, marginBottom: 14, maxWidth: 220 },
  bannerBtn: {
    alignSelf: 'flex-start', backgroundColor: colors.orange,
    borderRadius: radius.sm, paddingHorizontal: 18, paddingVertical: 10,
  },
  bannerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  section:  { padding: spacing.md, paddingBottom: 0 },
  catsRow:  { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm },
  catCard: {
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, alignItems: 'center', gap: 6, minWidth: 80,
  },
  catName:   { fontSize: 11, fontWeight: '600', color: colors.text2, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.text3, paddingVertical: spacing.sm },
  toast: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    backgroundColor: colors.bg4, borderRadius: radius.md,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  toastText: { color: colors.text, fontSize: 14, fontWeight: '500' },
});