// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button, InputField } from '../components';
import { useApp } from '../context/AppContext';

export default function AuthScreen() {
  const { login, register } = useApp();
  const [tab, setTab]       = useState('login');   // 'login' | 'register'
  const [loading, setLoad]  = useState(false);

  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [showPw, setShowPw]   = useState(false);

  async function handleSubmit() {
    if (!email || !password) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }
    setLoad(true);
    let r;
    if (tab === 'login') {
      r = await login(email.trim(), password);
    } else {
      if (!name) { Alert.alert('Atenção', 'Nome é obrigatório.'); setLoad(false); return; }
      if (password.length < 6) { Alert.alert('Atenção', 'Senha mínima de 6 caracteres.'); setLoad(false); return; }
      r = await register(name.trim(), email.trim(), password, phone.trim());
    }
    if (!r?.success) Alert.alert('Erro', r?.message || 'Tente novamente.');
    setLoad(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logo}><Text style={styles.logoIcon}>🔧</Text></View>
          <Text style={styles.brandSub}>AUTO PEÇAS</Text>
          <Text style={styles.brandName}>ASR Eletrônica</Text>
          <Text style={styles.brandDesc}>Peças eletrônicas com qualidade premium</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'login' && styles.tabActive]} onPress={() => setTab('login')}>
            <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'register' && styles.tabActive]} onPress={() => setTab('register')}>
            <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {tab === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>NOME COMPLETO</Text>
              <InputField icon="👤" placeholder="Seu nome" value={name} onChangeText={setName} />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>E-MAIL</Text>
            <InputField
              icon="✉️"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {tab === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>TELEFONE (opcional)</Text>
              <InputField icon="📱" placeholder="(11) 99999-9999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>SENHA</Text>
            <InputField
              icon="🔒"
              placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
              value={password}
              onChangeText={setPass}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              rightElement={
                <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />
          </View>

          <Button
            title={tab === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>

        <Text style={styles.footer}>
          {tab === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
          <Text style={styles.footerLink} onPress={() => setTab(tab === 'login' ? 'register' : 'login')}>
            {tab === 'login' ? 'Cadastre-se' : 'Entrar'}
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 28, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', paddingTop: 60, marginBottom: 32 },
  logo: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIcon: { fontSize: 34 },
  brandSub: { fontSize: 11, fontWeight: '600', color: colors.orange, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  brandName: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  brandDesc: { fontSize: 13, color: colors.text3, marginTop: 6 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg3,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 10,
    borderRadius: 9, alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text2 },
  tabTextActive: { color: '#fff' },
  form: { gap: spacing.md },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: colors.text2, letterSpacing: 0.5, textTransform: 'uppercase' },
  eyeIcon: { fontSize: 18 },
  submitBtn: { marginTop: 8 },
  footer: { textAlign: 'center', fontSize: 12, color: colors.text3, marginTop: 24 },
  footerLink: { color: colors.orange, fontWeight: '600' },
});
