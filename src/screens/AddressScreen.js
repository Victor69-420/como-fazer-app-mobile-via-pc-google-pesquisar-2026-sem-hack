// src/screens/AddressScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';

const INITIAL_ADDRESSES = [
  {
    id: '1', label: 'Casa', default: true,
    street: 'Rua das Peças Automotivas', number: '123',
    district: 'Centro', city: 'Rio de Janeiro', state: 'RJ', cep: '20040-020',
  },
];

export default function AddressScreen({ navigation }) {
  const [addresses, setAddresses]   = useState(INITIAL_ADDRESSES);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);

  const [label,    setLabel]    = useState('');
  const [street,   setStreet]   = useState('');
  const [number,   setNumber]   = useState('');
  const [district, setDistrict] = useState('');
  const [city,     setCity]     = useState('');
  const [state,    setState]    = useState('');
  const [cep,      setCep]      = useState('');

  function openNew() {
    setEditItem(null);
    setLabel(''); setStreet(''); setNumber('');
    setDistrict(''); setCity(''); setState(''); setCep('');
    setShowForm(true);
  }

  function openEdit(addr) {
    setEditItem(addr);
    setLabel(addr.label); setStreet(addr.street); setNumber(addr.number);
    setDistrict(addr.district); setCity(addr.city); setState(addr.state); setCep(addr.cep);
    setShowForm(true);
  }

  function save() {
    if (!street || !number || !city || !cep) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.'); return;
    }
    const newAddr = {
      id:       editItem?.id || String(Date.now()),
      label:    label || 'Endereço',
      default:  editItem?.default || addresses.length === 0,
      street, number, district, city, state, cep,
    };
    if (editItem) {
      setAddresses(prev => prev.map(a => a.id === editItem.id ? newAddr : a));
    } else {
      setAddresses(prev => [...prev, newAddr]);
    }
    setShowForm(false);
  }

  function remove(id) {
    Alert.alert('Remover', 'Deseja remover este endereço?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () =>
        setAddresses(prev => prev.filter(a => a.id !== id))
      },
    ]);
  }

  function setDefault(id) {
    setAddresses(prev => prev.map(a => ({ ...a, default: a.id === id })));
  }

  if (showForm) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>{editItem ? 'Editar Endereço' : 'Novo Endereço'}</Text>

          {[
            { label: 'Apelido (ex: Casa, Trabalho)', value: label,    set: setLabel,    placeholder: 'Casa' },
            { label: 'CEP *',                        value: cep,      set: setCep,      placeholder: '00000-000', keyboard: 'numeric' },
            { label: 'Rua / Avenida *',              value: street,   set: setStreet,   placeholder: 'Rua das Flores' },
            { label: 'Número *',                     value: number,   set: setNumber,   placeholder: '123',         keyboard: 'numeric' },
            { label: 'Bairro',                       value: district, set: setDistrict, placeholder: 'Centro' },
            { label: 'Cidade *',                     value: city,     set: setCity,     placeholder: 'Rio de Janeiro' },
            { label: 'Estado',                       value: state,    set: setState,    placeholder: 'RJ' },
          ].map(f => (
            <View key={f.label} style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={f.placeholder}
                placeholderTextColor={colors.text3}
                value={f.value}
                onChangeText={f.set}
                keyboardType={f.keyboard || 'default'}
              />
            </View>
          ))}

          <Button title="Salvar Endereço" onPress={save} style={{ marginTop: spacing.md }} />
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.list}>
        {addresses.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📍</Text>
            <Text style={styles.emptyText}>Nenhum endereço cadastrado</Text>
          </View>
        )}

        {addresses.map(addr => (
          <View key={addr.id} style={[styles.card, addr.default && styles.cardDefault]}>
            <View style={styles.cardHeader}>
              <View style={styles.labelRow}>
                <Text style={styles.cardLabel}>{addr.label}</Text>
                {addr.default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Padrão</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardAddress}>
                {addr.street}, {addr.number}{'\n'}
                {addr.district ? `${addr.district} · ` : ''}{addr.city} — {addr.state}{'\n'}
                CEP: {addr.cep}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {!addr.default && (
                <TouchableOpacity onPress={() => setDefault(addr.id)} style={styles.actionBtn}>
                  <Text style={styles.actionText}>✓ Definir padrão</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => openEdit(addr)} style={styles.actionBtn}>
                <Text style={styles.actionText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(addr.id)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.error }]}>🗑️ Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Button title="+ Adicionar Endereço" onPress={openNew} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  list:        { padding: spacing.md, gap: spacing.md },
  empty:       { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText:   { fontSize: 15, color: colors.text3 },
  card: {
    backgroundColor: colors.bg3, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm,
  },
  cardDefault: { borderColor: colors.orange },
  cardHeader:  { gap: 6 },
  labelRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel:   { fontSize: 15, fontWeight: '700', color: colors.text },
  defaultBadge:{ backgroundColor: 'rgba(255,107,26,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,26,0.3)' },
  defaultText: { fontSize: 10, color: colors.orange, fontWeight: '700' },
  cardAddress: { fontSize: 13, color: colors.text2, lineHeight: 20 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  actionBtn:   { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.bg4, borderRadius: 8 },
  actionText:  { fontSize: 12, color: colors.text2, fontWeight: '500' },
  form:        { padding: spacing.md, gap: spacing.sm },
  formTitle:   { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  fieldWrap:   { gap: 6 },
  fieldLabel:  { fontSize: 12, fontWeight: '600', color: colors.text2, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: {
    backgroundColor: colors.bg3, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.text, fontSize: 14,
  },
  cancelBtn:  { alignItems: 'center', marginTop: spacing.sm, padding: spacing.sm },
  cancelText: { color: colors.text3, fontSize: 14 },
});