// src/screens/PaymentScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

const INITIAL_CARDS = [
  { id: '1', brand: 'Visa', last4: '4242', holder: 'VICTOR E', expiry: '12/27', default: true },
];

const PIX_KEY = '21994498974';

export default function PaymentScreen() {
  const [cards, setCards]       = useState(INITIAL_CARDS);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab]           = useState('cards'); // 'cards' | 'pix'

  const [number,  setNumber]  = useState('');
  const [holder,  setHolder]  = useState('');
  const [expiry,  setExpiry]  = useState('');
  const [cvv,     setCvv]     = useState('');
  const [brand,   setBrand]   = useState('Visa');

  function formatNumber(v) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  }

  function saveCard() {
    const clean = number.replace(/\s/g, '');
    if (clean.length < 16 || !holder || expiry.length < 5 || cvv.length < 3) {
      Alert.alert('Atenção', 'Preencha todos os dados do cartão corretamente.'); return;
    }
    const newCard = {
      id:      String(Date.now()),
      brand,
      last4:   clean.slice(-4),
      holder:  holder.toUpperCase(),
      expiry,
      default: cards.length === 0,
    };
    setCards(prev => [...prev, newCard]);
    setShowForm(false);
    setNumber(''); setHolder(''); setExpiry(''); setCvv('');
  }

  function removeCard(id) {
    Alert.alert('Remover cartão', 'Deseja remover este cartão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () =>
        setCards(prev => prev.filter(c => c.id !== id))
      },
    ]);
  }

  function setDefault(id) {
    setCards(prev => prev.map(c => ({ ...c, default: c.id === id })));
  }

  const BRAND_COLORS = {
    Visa: '#1A1F71', Mastercard: '#EB001B', Elo: '#FFD700',
    'American Express': '#007BC1', Hipercard: '#CC0000',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'cards' && styles.tabActive]} onPress={() => setTab('cards')}>
          <Text style={[styles.tabText, tab === 'cards' && styles.tabTextActive]}>💳 Cartões</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'pix' && styles.tabActive]} onPress={() => setTab('pix')}>
          <Text style={[styles.tabText, tab === 'pix' && styles.tabTextActive]}>⚡ Pix</Text>
        </TouchableOpacity>
      </View>

      {tab === 'pix' ? (
        <ScrollView contentContainerStyle={styles.pixWrap}>
          <View style={styles.pixCard}>
            <Text style={styles.pixIcon}>⚡</Text>
            <Text style={styles.pixTitle}>Pagar com Pix</Text>
            <Text style={styles.pixDesc}>Pagamento instantâneo, 24h por dia, 7 dias por semana.</Text>
            <View style={styles.pixKeyWrap}>
              <Text style={styles.pixKeyLabel}>Chave Pix cadastrada</Text>
              <Text style={styles.pixKey}>{PIX_KEY}</Text>
              <Text style={styles.pixKeyType}>Telefone</Text>
            </View>
            <View style={styles.pixInfo}>
              <Text style={styles.pixInfoText}>✅ Aprovação instantânea</Text>
              <Text style={styles.pixInfoText}>✅ Sem taxas adicionais</Text>
              <Text style={styles.pixInfoText}>✅ Seguro e rápido</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {cards.length === 0 && !showForm && (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>💳</Text>
                <Text style={styles.emptyText}>Nenhum cartão cadastrado</Text>
              </View>
            )}

            {cards.map(card => (
              <View key={card.id} style={[styles.cardItem, card.default && styles.cardDefault]}>
                <View style={[styles.cardBrand, { backgroundColor: BRAND_COLORS[card.brand] || colors.bg4 }]}>
                  <Text style={styles.cardBrandText}>{card.brand}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                  <Text style={styles.cardHolder}>{card.holder}</Text>
                  <Text style={styles.cardExpiry}>Validade: {card.expiry}</Text>
                </View>
                <View style={styles.cardRight}>
                  {card.default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Padrão</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {cards.length > 0 && (
              <View style={styles.actionRow}>
                {cards.map(card => !card.default && (
                  <TouchableOpacity key={card.id} onPress={() => setDefault(card.id)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>✓ Definir •••{card.last4} como padrão</Text>
                  </TouchableOpacity>
                ))}
                {cards.map(card => (
                  <TouchableOpacity key={`rm-${card.id}`} onPress={() => removeCard(card.id)} style={styles.actionBtn}>
                    <Text style={[styles.actionText, { color: colors.error }]}>🗑️ Remover •••{card.last4}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showForm ? (
              <View style={styles.form}>
                <Text style={styles.formTitle}>Novo Cartão</Text>

                {/* Bandeira */}
                <Text style={styles.fieldLabel}>Bandeira</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    {CARD_BRANDS.map(b => (
                      <TouchableOpacity
                        key={b}
                        style={[styles.brandChip, brand === b && styles.brandChipActive]}
                        onPress={() => setBrand(b)}
                      >
                        <Text style={[styles.brandChipText, brand === b && { color: '#fff' }]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {[
                  { label: 'Número do Cartão', value: number, set: v => setNumber(formatNumber(v)), placeholder: '0000 0000 0000 0000', keyboard: 'numeric' },
                  { label: 'Nome no Cartão',   value: holder, set: setHolder, placeholder: 'NOME SOBRENOME', caps: 'characters' },
                  { label: 'Validade (MM/AA)', value: expiry, set: v => setExpiry(formatExpiry(v)), placeholder: '12/27', keyboard: 'numeric' },
                  { label: 'CVV',             value: cvv,    set: setCvv,    placeholder: '123', keyboard: 'numeric', secure: true },
                ].map(f => (
                  <View key={f.label} style={[styles.fieldWrap]}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.text3}
                      value={f.value}
                      onChangeText={f.set}
                      keyboardType={f.keyboard || 'default'}
                      autoCapitalize={f.caps || 'none'}
                      secureTextEntry={f.secure}
                      maxLength={f.label === 'CVV' ? 4 : undefined}
                    />
                  </View>
                ))}

                <Button title="Salvar Cartão" onPress={saveCard} style={{ marginTop: spacing.md }} />
                <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button title="+ Adicionar Cartão" onPress={() => setShowForm(true)} style={{ marginTop: spacing.sm }} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', backgroundColor: colors.bg3,
    margin: spacing.md, borderRadius: radius.md,
    padding: 4, borderWidth: 1, borderColor: colors.border,
  },
  tab:         { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive:   { backgroundColor: colors.orange },
  tabText:     { fontSize: 14, fontWeight: '600', color: colors.text2 },
  tabTextActive:{ color: '#fff', fontWeight: '700' },
  list:        { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  empty:       { alignItems: 'center', paddingTop: 40, gap: spacing.sm },
  emptyText:   { fontSize: 15, color: colors.text3 },
  cardItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  cardDefault:   { borderColor: colors.orange },
  cardBrand:     { width: 52, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardBrandText: { color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  cardNumber:    { fontSize: 14, fontWeight: '700', color: colors.text, letterSpacing: 1 },
  cardHolder:    { fontSize: 11, color: colors.text2, marginTop: 2 },
  cardExpiry:    { fontSize: 11, color: colors.text3, marginTop: 1 },
  cardRight:     { alignItems: 'flex-end' },
  defaultBadge:  { backgroundColor: 'rgba(255,107,26,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,26,0.3)' },
  defaultText:   { fontSize: 10, color: colors.orange, fontWeight: '700' },
  actionRow:     { gap: spacing.sm },
  actionBtn:     { padding: spacing.sm, backgroundColor: colors.bg4, borderRadius: 8, alignItems: 'center' },
  actionText:    { fontSize: 12, color: colors.text2, fontWeight: '500' },
  form:          { gap: spacing.sm, marginTop: spacing.md, backgroundColor: colors.bg3, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  formTitle:     { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  fieldWrap:     { gap: 6 },
  fieldLabel:    { fontSize: 11, fontWeight: '600', color: colors.text2, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput:     { backgroundColor: colors.bg4, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 14 },
  brandChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.bg4, borderWidth: 1, borderColor: colors.border },
  brandChipActive:{ backgroundColor: colors.orange, borderColor: colors.orange },
  brandChipText: { fontSize: 12, fontWeight: '600', color: colors.text2 },
  cancelBtn:     { alignItems: 'center', padding: spacing.sm },
  cancelText:    { color: colors.text3, fontSize: 14 },
  pixWrap:       { padding: spacing.md },
  pixCard:       { backgroundColor: colors.bg3, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,107,26,0.3)', alignItems: 'center', gap: spacing.md },
  pixIcon:       { fontSize: 56 },
  pixTitle:      { fontSize: 22, fontWeight: '800', color: colors.text },
  pixDesc:       { fontSize: 13, color: colors.text2, textAlign: 'center' },
  pixKeyWrap:    { backgroundColor: colors.bg4, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', width: '100%', gap: 4 },
  pixKeyLabel:   { fontSize: 11, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  pixKey:        { fontSize: 22, fontWeight: '800', color: colors.orange, letterSpacing: 2 },
  pixKeyType:    { fontSize: 11, color: colors.text2 },
  pixInfo:       { gap: 6, width: '100%' },
  pixInfoText:   { fontSize: 14, color: colors.text2 },
});