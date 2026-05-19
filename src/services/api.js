// src/services/api.js
import * as SecureStore from 'expo-secure-store';

// ⚠️ Rode "ipconfig" no Windows e troque pelo seu IPv4 da rede Wi-Fi
export const API_BASE = 'http://192.168.1.100:3001/api';

const TOKEN_KEY      = 'asr_token';
const USER_KEY       = 'asr_user';
const LOCAL_USERS_KEY = 'asr_users_offline';

// ── Formatador de preço ──────────────────────────────────────
export function fmtPrice(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

// ── Token / sessão ───────────────────────────────────────────
export async function getToken() {
  try { return await SecureStore.getItemAsync(TOKEN_KEY); }
  catch { return null; }
}
export async function clearToken() {
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
  try { await SecureStore.deleteItemAsync(USER_KEY);  } catch {}
}
async function persistSession(token, user) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}
export async function getSavedUser() {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Health check ─────────────────────────────────────────────
export async function checkBackendOnline() {
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 3000);
    const res  = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(tid);
    return res.ok;
  } catch {
    return false;
  }
}

// ── apiFetch (requer backend online) ────────────────────────
export async function apiFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro ${res.status}`);
  }
  return res.json();
}

// ── Auth via API real ─────────────────────────────────────────
export async function loginApi({ email, password }) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  // res = { success, token, user }
  await persistSession(res.token, res.user);
  return res;
}

export async function registerApi({ name, email, password, phone }) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: { name, email, password, phone },
  });
  await persistSession(res.token, res.user);
  return res;
}

// ── Auth offline (fallback sem servidor) ─────────────────────
function localHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = Math.imul(h, 33) ^ str.charCodeAt(i);
  return `lh_${Math.abs(h >>> 0)}`;
}
async function getLocalUsers() {
  try {
    const raw = await SecureStore.getItemAsync(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveLocalUsers(users) {
  await SecureStore.setItemAsync(LOCAL_USERS_KEY, JSON.stringify(users));
}
export async function loginLocal({ email, password }) {
  await new Promise(r => setTimeout(r, 500));
  const users = await getLocalUsers();
  const user  = users.find(u => u.email === email && u.pw === localHash(password));
  if (!user) throw new Error('E-mail ou senha incorretos.');
  const token    = `local_${Date.now()}`;
  const safeUser = { id: user.id, name: user.name, email, phone: user.phone || '',
    avatar: user.name?.[0]?.toUpperCase() || 'U', tag: '🔧 Cliente ASR',
    stats: { orders: 0, totalSpent: 0, points: 0 } };
  await persistSession(token, safeUser);
  return { success: true, token, user: safeUser };
}
export async function registerLocal({ name, email, password, phone }) {
  await new Promise(r => setTimeout(r, 500));
  const users = await getLocalUsers();
  if (users.find(u => u.email === email)) throw new Error('E-mail já cadastrado.');
  const newUser = { id: `u_${Date.now()}`, name, email, phone: phone || '', pw: localHash(password) };
  users.push(newUser);
  await saveLocalUsers(users);
  const token    = `local_${Date.now()}`;
  const safeUser = { id: newUser.id, name, email, phone: phone || '',
    avatar: name?.[0]?.toUpperCase() || 'U', tag: '🔧 Cliente ASR',
    stats: { orders: 0, totalSpent: 0, points: 0 } };
  await persistSession(token, safeUser);
  return { success: true, token, user: safeUser };
}

// ── Categorias ───────────────────────────────────────────────
export const CATEGORIES = [
  'Todos', 'Elétrica', 'Motor', 'Iluminação', 'Bateria',
  'Freios', 'Suspensão', 'Ar Cond.', 'Módulos',
];

// ── Produtos locais (espelham o banco do servidor) ────────────
export const LOCAL_PRODUCTS = [
  { id:1,  emoji:'⚡', brand:'Bosch',   name:'Módulo de Ignição Universal',   price:289.90, oldPrice:350.00, badge:'−17%', cat:'Elétrica',   rating:4.8, reviews:234, stock:18, description:'Módulo de ignição de alta performance compatível com a maioria dos motores nacionais.' },
  { id:2,  emoji:'🔌', brand:'Delphi',  name:'Sensor MAP de Pressão 1 Bar',   price:124.50, oldPrice:null,   badge:'Novo',  cat:'Elétrica',   rating:4.6, reviews:89,  stock:35, description:'Sensor de pressão absoluta do coletor (MAP) com alta precisão.' },
  { id:3,  emoji:'🕯️', brand:'NGK',     name:'Velas de Ignição Iridium Gx8', price:68.00,  oldPrice:85.00,  badge:'−20%', cat:'Motor',      rating:4.9, reviews:567, stock:80, description:'Velas de ignição com eletrodo de iridium. Partida mais fácil, menor consumo.' },
  { id:4,  emoji:'💡', brand:'Osram',   name:'Kit LED H4 6000K 8000lm',       price:199.90, oldPrice:240.00, badge:'−17%', cat:'Iluminação', rating:4.7, reviews:312, stock:22, description:'Kit completo de faróis LED H4 6000K com 8000 lumens. Plug-and-play.' },
  { id:5,  emoji:'🔋', brand:'Moura',   name:'Bateria 60Ah Selada MF60',      price:389.00, oldPrice:null,   badge:'',     cat:'Bateria',    rating:4.5, reviews:145, stock:10, description:'Bateria selada livre de manutenção com 60Ah. Alta vida útil.' },
  { id:6,  emoji:'❄️', brand:'Valeo',   name:'Compressor Ar-Cond. Universal', price:650.00, oldPrice:780.00, badge:'−17%', cat:'Ar Cond.',   rating:4.4, reviews:76,  stock:6,  description:'Compressor de ar condicionado universal com alta eficiência energética.' },
  { id:7,  emoji:'🔩', brand:'Monroe',  name:'Amortecedor Dianteiro Par',     price:310.00, oldPrice:380.00, badge:'−18%', cat:'Suspensão',  rating:4.6, reviews:198, stock:14, description:'Par de amortecedores dianteiros a gás de alta performance.' },
  { id:8,  emoji:'🛞', brand:'Fremax',  name:'Disco de Freio Ventilado 280mm',price:175.00, oldPrice:null,   badge:'Novo',  cat:'Freios',     rating:4.8, reviews:423, stock:28, description:'Disco de freio ventilado de alta performance com 280mm de diâmetro.' },
  { id:9,  emoji:'📱', brand:'Magneti', name:'Módulo BSI Completo 508',       price:820.00, oldPrice:1050.00,badge:'−22%', cat:'Módulos',    rating:4.3, reviews:54,  stock:4,  description:'Módulo BSI completo para Peugeot 508. Programado e testado.' },
  { id:10, emoji:'⚙️', brand:'Mahle',   name:'Kit Filtros Completo Motor',    price:145.00, oldPrice:160.00, badge:'',     cat:'Motor',      rating:4.7, reviews:302, stock:55, description:'Kit completo de filtros para motor incluindo óleo, ar, combustível e cabine.' },
];