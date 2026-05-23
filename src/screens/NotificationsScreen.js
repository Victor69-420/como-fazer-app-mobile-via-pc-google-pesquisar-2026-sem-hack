// src/screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';
import {
  scheduleRecurringNotifications,
  cancelAllNotifications,
  sendTestNotification,
  isNotificationsActive,
} from '../services/notifications';

export default function NotificationsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [promos,  setPromos]  = useState(true);
  const [orders,  setOrders]  = useState(true);
  const [stock,   setStock]   = useState(false);

  useEffect(() => {
    setEnabled(isNotificationsActive());
  }, []);

  function toggleNotifications(val) {
    if (val) {
      scheduleRecurringNotifications();
      setEnabled(true);
      Alert.alert(
        '✅ Notificações ativadas!',
        'Você receberá alertas sobre peças e promoções a cada 5 minutos enquanto o app estiver aberto.'
      );
    } else {
      cancelAllNotifications();
      setEnabled(false);
      Alert.alert('Notificações desativadas', 'Você não receberá mais alertas.');
    }
  }

  function handleTest() {
    sendTestNotification();
  }

  const SETTINGS = [
    { label: 'Promoções e ofertas',  desc: 'Descontos e peças em destaque',          icon: '🏷️', val: promos,  set: setPromos },
    { label: 'Status de pedidos',    desc: 'Confirmação e entrega dos seus pedidos', icon: '📦', val: orders,  set: setOrders },
    { label: 'Produtos em estoque',  desc: 'Quando um item volta ao estoque',        icon: '🔔', val: stock,   set: setStock  },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Toggle principal */}
        <View style={[styles.mainCard, enabled && styles.mainCardActive]}>
          <View style={styles.mainLeft}>
            <Text style={styles.mainIcon}>{enabled ? '🔔' : '🔕'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>Notificações</Text>
              <Text style={styles.mainDesc}>
                {enabled ? 'Ativas · a cada 5 minutos' : 'Desativadas'}
              </Text>
            </View>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.bg4, true: colors.orange }}
            thumbColor="#fff"
          />
        </View>

        {/* Info quando ativo */}
        {enabled && (
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Frequência: a cada 5 minutos</Text>
              <Text style={styles.infoDesc}>
                Alertas in-app com dicas de manutenção e promoções de peças automotivas enquanto o app estiver aberto.
              </Text>
            </View>
          </View>
        )}

        {/* Tipos */}
        <Text style={styles.sectionTitle}>Tipos de Notificação</Text>
        <View style={styles.settingsCard}>
          {SETTINGS.map((s, i) => (
            <View key={s.label} style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingBorder]}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={styles.settingDesc}>{s.desc}</Text>
              </View>
              <Switch
                value={s.val}
                onValueChange={s.set}
                disabled={!enabled}
                trackColor={{ false: colors.bg4, true: colors.orange }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Preview */}
        <Text style={styles.sectionTitle}>Exemplos de Alertas</Text>
        <View style={styles.previewCard}>
          {[
            { title: '🔧 Hora de revisar seu carro!',      body: 'Módulos e sensores com até 22% OFF.' },
            { title: '🛞 Freios em dia = segurança!',      body: 'Discos e pastilhas de alta performance.' },
            { title: '🔋 Bateria fraca? A gente resolve!', body: 'Baterias Moura com 18 meses de garantia.' },
          ].map((m, i) => (
            <View key={i} style={[styles.previewItem, i < 2 && styles.previewBorder]}>
              <Text style={styles.previewTitle}>{m.title}</Text>
              <Text style={styles.previewBody}>{m.body}</Text>
            </View>
          ))}
        </View>

        {/* Botão teste */}
        <Button
          title="📬 Enviar Alerta de Teste"
          onPress={handleTest}
          variant="secondary"
          style={{ marginTop: spacing.sm }}
        />

        {enabled && (
          <TouchableOpacity onPress={() => toggleNotifications(false)} style={styles.disableBtn}>
            <Text style={styles.disableText}>Desativar todas as notificações</Text>
          </TouchableOpacity>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            ℹ️ Os alertas aparecem como pop-ups enquanto o app estiver aberto. Para notificações em segundo plano, é necessário publicar o app na Play Store.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content:      { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  mainCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bg3, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.border,
  },
  mainCardActive: { borderColor: colors.orange, backgroundColor: 'rgba(255,107,26,0.05)' },
  mainLeft:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  mainIcon:     { fontSize: 32 },
  mainTitle:    { fontSize: 16, fontWeight: '700', color: colors.text },
  mainDesc:     { fontSize: 12, color: colors.text3, marginTop: 2 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: 'rgba(255,107,26,0.08)', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,107,26,0.2)',
  },
  infoIcon:     { fontSize: 20 },
  infoTitle:    { fontSize: 13, fontWeight: '700', color: colors.orange, marginBottom: 4 },
  infoDesc:     { fontSize: 12, color: colors.text2, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  settingsCard: { backgroundColor: colors.bg3, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  settingBorder:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  settingDesc:  { fontSize: 12, color: colors.text3, marginTop: 2 },
  previewCard:  { backgroundColor: colors.bg3, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  previewItem:  { padding: spacing.md, gap: 4 },
  previewBorder:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  previewBody:  { fontSize: 12, color: colors.text2 },
  disableBtn:   { alignItems: 'center', padding: spacing.sm },
  disableText:  { fontSize: 13, color: colors.error },
  noteCard: {
    backgroundColor: colors.bg3, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  noteText: { fontSize: 12, color: colors.text3, lineHeight: 18 },
});