// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Avatar, Button } from '../components';
import { apiFetch, fmtPrice } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const { user, setUser, apiOnline, logout, orders: localOrders } = useApp();
  const [orders, setOrders]   = useState(null);
  const [showOrd, setShowOrd] = useState(false);
  const [loadOrd, setLoadOrd] = useState(false);

  const initials = user?.name?.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  }

  async function loadOrders() {
    setLoadOrd(true);
    if (apiOnline) {
      try {
        const r = await apiFetch('/orders');
        setOrders(r?.orders || []);
      } catch {
        setOrders(localOrders || []);
      }
    } else {
      // Modo offline: mostra pedidos feitos nesta sessão
      setOrders(localOrders || []);
    }
    setShowOrd(true);
    setLoadOrd(false);
  }

  const menuItems = [
    { icon: '📦', label: 'Meus Pedidos',          onPress: loadOrders },
    { icon: '📍', label: 'Endereços',              onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.') },
    { icon: '💳', label: 'Formas de Pagamento',   onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.') },
    { icon: '🔔', label: 'Notificações',           onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.') },
    { icon: '⚙️', label: 'Configurações',          onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento.') },
    { icon: '💬', label: 'Suporte',                onPress: () => Alert.alert('Suporte ASR', 'WhatsApp: (21) 9 9999-9999\nE-mail: suporte@asreletronica.com.br') },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} showsVerticalScrollIndicator={false}>

      {/* ── Card do usuário ── */}
      <View style={styles.userCard}>
        <Avatar initials={initials} size={72} />
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{user?.tag || '🔧 Cliente ASR'}</Text>
          </View>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{user?.stats?.orders ?? 0}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>R$ {((user?.stats?.totalSpent || 0)).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Gasto</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{user?.stats?.points ?? 0}</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
      </View>

      {/* ── Status da API ── */}
      <View style={styles.apiStatus}>
        <View style={[styles.statusDot, { backgroundColor: apiOnline ? colors.success : colors.error }]} />
        <Text style={styles.statusText}>
          {apiOnline ? 'Conectado ao servidor' : 'Modo offline (dados locais)'}
        </Text>
        {!apiOnline && (
          <Text style={styles.offlineHint}> · pedidos salvos localmente</Text>
        )}
      </View>

      {/* ── Menu ── */}
      <View style={styles.menu}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, idx === menuItems.length - 1 && { borderBottomWidth: 0 }]}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.label === 'Meus Pedidos' && loadOrd
              ? <ActivityIndicator size="small" color={colors.orange} />
              : <Text style={styles.menuArrow}>›</Text>
            }
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Lista de pedidos ── */}
      {showOrd && orders !== null && (
        <View style={styles.ordersBlock}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>
              📦 Pedidos {!apiOnline ? '(offline)' : ''}
            </Text>
            <TouchableOpacity onPress={() => setShowOrd(false)}>
              <Text style={styles.ordersClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {orders.length === 0 ? (
            <Text style={styles.noOrders}>Nenhum pedido realizado ainda.</Text>
          ) : (
            orders.map((o, i) => (
              <View key={o.orderId || i} style={styles.orderItem}>
                <View>
                  <Text style={styles.orderId}>{o.orderId}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderTotal}>{fmtPrice(o.total)}</Text>
                  <View style={styles.orderStatus}>
                    <Text style={styles.orderStatusText}>{o.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ── Logout ── */}
      <View style={styles.logoutWrap}>
        <Button title="🚪  Sair da Conta" onPress={handleLogout} variant="secondary" />
      </View>

      <Text style={styles.version}>ASR Eletrônica © 2025 · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, paddingTop: spacing.sm,
    backgroundColor: colors.bg3, borderRadius: radius.lg,
    margin: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  userName:  { fontSize: 20, fontWeight: '800', color: colors.text },
  userEmail: { fontSize: 13, color: colors.text3, marginBottom: 6 },
  tag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,107,26,0.12)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.25)',
  },
  tagText: { fontSize: 11, color: colors.orange, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', gap: spacing.sm,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
  },
  statCard: {
    flex: 1, backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  statVal:   { fontSize: 20, fontWeight: '800', color: colors.orange },
  statLabel: { fontSize: 11, color: colors.text3, textAlign: 'center' },
  apiStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: colors.bg3, borderRadius: radius.sm,
    padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
    flexWrap: 'wrap',
  },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { fontSize: 12, color: colors.text2 },
  offlineHint: { fontSize: 11, color: colors.text3, fontStyle: 'italic' },
  menu: {
    marginHorizontal: spacing.md, backgroundColor: colors.bg3,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  menuArrow: { fontSize: 20, color: colors.text3 },
  ordersBlock: {
    margin: spacing.md, backgroundColor: colors.bg3,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  ordersHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  ordersTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  ordersClose: { fontSize: 18, color: colors.text3, padding: 4 },
  noOrders:    { fontSize: 14, color: colors.text3, textAlign: 'center', padding: spacing.md },
  orderItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  orderId:   { fontSize: 13, fontWeight: '700', color: colors.text },
  orderDate: { fontSize: 11, color: colors.text3, marginTop: 2 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { fontSize: 15, fontWeight: '700', color: colors.orange },
  orderStatus: {
    backgroundColor: 'rgba(77,170,116,0.15)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  orderStatusText: {
    fontSize: 10, color: colors.success,
    fontWeight: '600', textTransform: 'uppercase',
  },
  logoutWrap: { margin: spacing.md, marginTop: spacing.lg },
  version:    { textAlign: 'center', fontSize: 11, color: colors.text3, marginBottom: spacing.xl },
});