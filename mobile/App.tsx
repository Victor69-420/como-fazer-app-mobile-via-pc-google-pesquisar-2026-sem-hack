// App.tsx – ASR Eletrônica Auto Peças
// Telas: Welcome → Login / Cadastro → Home
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Coloque o IP da sua máquina na rede local ────────────────
//     Ex: 'http://192.168.1.100:3001'
const API_URL = 'http://SEU_IP_AQUI:3001';
// ─────────────────────────────────────────────────────────────

type Screen = 'welcome' | 'login' | 'register' | 'home';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  tag: string;
  stats: { orders: number; totalSpent: number; points: number };
}

// ════════════════════════════════════════════
//  TELA: WELCOME
// ════════════════════════════════════════════
function WelcomeScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.logo}>
        <Text style={s.logoIcon}>⚡</Text>
      </View>
      <Text style={s.sub}>AUTO PEÇAS</Text>
      <Text style={s.title}>ASR Eletrônica</Text>
      <Text style={s.desc}>Seu app de peças automotivas</Text>

      <TouchableOpacity style={s.btn} onPress={() => go('login')}>
        <Text style={s.btnText}>Entrar na conta</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.btn2} onPress={() => go('register')}>
        <Text style={s.btn2Text}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════
//  TELA: LOGIN
// ════════════════════════════════════════════
function LoginScreen({
  go, onLogin,
}: { go: (s: Screen) => void; onLogin: (u: User, token: string) => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.'); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        onLogin(data.user, data.token);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.\nVerifique o IP em API_URL.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.formContainer}>
        <TouchableOpacity style={s.backBtn} onPress={() => go('welcome')}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={s.logo}>
          <Text style={s.logoIcon}>⚡</Text>
        </View>
        <Text style={s.formTitle}>Entrar na conta</Text>
        <Text style={s.formSub}>Bem-vindo(a) de volta!</Text>

        <View style={s.inputGroup}>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            placeholder="seu@email.com"
            placeholderTextColor="#5A5660"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor="#5A5660"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => go('register')}>
          <Text style={s.linkText}>Não tem conta? <Text style={s.linkAccent}>Criar conta</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════
//  TELA: CADASTRO
// ════════════════════════════════════════════
function RegisterScreen({
  go, onLogin,
}: { go: (s: Screen) => void; onLogin: (u: User, token: string) => void }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Nome, e-mail e senha são obrigatórios.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.'); return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        onLogin(data.user, data.token);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.\nVerifique o IP em API_URL.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.formContainer}>
        <TouchableOpacity style={s.backBtn} onPress={() => go('welcome')}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={s.logo}>
          <Text style={s.logoIcon}>⚡</Text>
        </View>
        <Text style={s.formTitle}>Criar conta</Text>
        <Text style={s.formSub}>Junte-se à ASR Eletrônica</Text>

        <View style={s.inputGroup}>
          <Text style={s.label}>Nome completo</Text>
          <TextInput
            style={s.input}
            placeholder="Seu nome"
            placeholderTextColor="#5A5660"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            placeholder="seu@email.com"
            placeholderTextColor="#5A5660"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Telefone (opcional)</Text>
          <TextInput
            style={s.input}
            placeholder="(21) 99999-9999"
            placeholderTextColor="#5A5660"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Senha</Text>
          <TextInput
            style={s.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#5A5660"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[s.btn, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => go('login')}>
          <Text style={s.linkText}>Já tem conta? <Text style={s.linkAccent}>Entrar</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════
//  TELA: HOME (após login)
// ════════════════════════════════════════════
function HomeScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  async function handleLogout() {
    await AsyncStorage.removeItem('token');
    onLogout();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0C0C0E' }}>
      <ScrollView contentContainerStyle={s.homeContainer}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={s.homeHeader}>
          <View>
            <Text style={s.homeGreeting}>Olá, {user.name.split(' ')[0]} 👋</Text>
            <Text style={s.homeTag}>{user.tag}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.avatar}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{user.stats.orders}</Text>
            <Text style={s.statLabel}>Pedidos</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>R$ {user.stats.totalSpent.toFixed(0)}</Text>
            <Text style={s.statLabel}>Gasto total</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{user.stats.points} pts</Text>
            <Text style={s.statLabel}>Pontos</Text>
          </View>
        </View>

        {/* Banner */}
        <View style={s.banner}>
          <Text style={s.bannerIcon}>⚡</Text>
          <View>
            <Text style={s.bannerTitle}>ASR Eletrônica</Text>
            <Text style={s.bannerSub}>Peças automotivas com qualidade</Text>
          </View>
        </View>

        {/* Categorias rápidas */}
        <Text style={s.sectionTitle}>Categorias</Text>
        <View style={s.catGrid}>
          {['⚡ Elétrica','🕯️ Motor','💡 Iluminação','🔋 Bateria','❄️ Ar Cond.','🛞 Freios'].map(c => (
            <View key={c} style={s.catItem}>
              <Text style={s.catText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════
//  ROOT – gerencia qual tela mostrar
// ════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [user, setUser]     = useState<User | null>(null);

  function handleLogin(u: User, _token: string) {
    setUser(u);
    setScreen('home');
  }

  function handleLogout() {
    setUser(null);
    setScreen('welcome');
  }

  if (screen === 'home' && user) {
    return <HomeScreen user={user} onLogout={handleLogout} />;
  }
  if (screen === 'login') {
    return <LoginScreen go={setScreen} onLogin={handleLogin} />;
  }
  if (screen === 'register') {
    return <RegisterScreen go={setScreen} onLogin={handleLogin} />;
  }
  return <WelcomeScreen go={setScreen} />;
}

// ════════════════════════════════════════════
//  ESTILOS
// ════════════════════════════════════════════
const s = StyleSheet.create({
  // ── Welcome ──
  container: {
    flex: 1,
    backgroundColor: '#0C0C0E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  logo: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#FF6B1A',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B1A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  logoIcon: { fontSize: 38 },
  sub: { fontSize: 11, fontWeight: '600', color: '#FF6B1A', letterSpacing: 3, marginBottom: 6 },
  title: { fontSize: 36, fontWeight: '800', color: '#F0EDE8', marginBottom: 8 },
  desc: { fontSize: 14, color: '#5A5660', marginBottom: 40 },
  btn: {
    width: '100%', backgroundColor: '#FF6B1A',
    padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btn2: {
    width: '100%', backgroundColor: '#1E1E23',
    padding: 16, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  btn2Text: { color: '#A09C96', fontSize: 16, fontWeight: '600' },

  // ── Form ──
  formContainer: {
    flexGrow: 1, backgroundColor: '#0C0C0E',
    padding: 28, paddingTop: 60,
  },
  backBtn: { marginBottom: 24 },
  backText: { color: '#FF6B1A', fontSize: 15, fontWeight: '600' },
  formTitle: { fontSize: 28, fontWeight: '800', color: '#F0EDE8', marginTop: 16, marginBottom: 4 },
  formSub: { fontSize: 14, color: '#5A5660', marginBottom: 32 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#A09C96', marginBottom: 8 },
  input: {
    backgroundColor: '#1E1E23', color: '#F0EDE8',
    borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  linkText: { color: '#5A5660', fontSize: 14, textAlign: 'center', marginTop: 20 },
  linkAccent: { color: '#FF6B1A', fontWeight: '700' },

  // ── Home ──
  homeContainer: { padding: 24, paddingTop: 16 },
  homeHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  homeGreeting: { fontSize: 22, fontWeight: '800', color: '#F0EDE8' },
  homeTag: { fontSize: 13, color: '#FF6B1A', marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FF6B1A', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#1E1E23',
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  statNum: { color: '#FF6B1A', fontWeight: '800', fontSize: 16 },
  statLabel: { color: '#5A5660', fontSize: 11, marginTop: 4 },

  banner: {
    backgroundColor: '#1A1208', borderRadius: 16,
    padding: 18, flexDirection: 'row', alignItems: 'center',
    gap: 14, marginBottom: 28,
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.2)',
  },
  bannerIcon: { fontSize: 36 },
  bannerTitle: { color: '#F0EDE8', fontWeight: '800', fontSize: 17 },
  bannerSub: { color: '#A09C96', fontSize: 13, marginTop: 2 },

  sectionTitle: { color: '#F0EDE8', fontWeight: '700', fontSize: 17, marginBottom: 14 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  catItem: {
    backgroundColor: '#1E1E23', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  catText: { color: '#A09C96', fontSize: 13, fontWeight: '600' },

  logoutBtn: {
    backgroundColor: '#1E1E23', padding: 16,
    borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  logoutText: { color: '#FF4444', fontWeight: '700', fontSize: 15 },
});