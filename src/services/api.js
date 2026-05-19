// src/services/api.js
// Modo offline: funciona sem backend. Dados salvos localmente.
import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'http://192.168.1.100:3001/api'; // Ajuste se quiser usar backend real

const TOKEN_KEY = 'asr_token';
const USERS_KEY = 'asr_users';
const USER_KEY  = 'asr_user';

// ── Helpers de storage ───────────────────────────────────────
async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  try { return await SecureStore.getItemAsync(TOKEN_KEY); }
  catch { return null; }
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

async function getUsers() {
  try {
    const raw = await SecureStore.getItemAsync(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function saveUsers(users) {
  await SecureStore.setItemAsync(USERS_KEY, JSON.stringify(users));
}

// ── Auth local ───────────────────────────────────────────────
export async function loginLocal({ email, password }) {
  await delay(700);
  const users = await getUsers();
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('E-mail ou senha incorretos.');
  const token = `local_${Date.now()}_${user.id}`;
  await saveToken(token);
  const safeUser = { id: user.id, name: user.name, email: user.email, phone: user.phone };
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(safeUser));
  return { token, user: safeUser };
}

export async function registerLocal({ name, email, phone, password }) {
  await delay(700);
  const users = await getUsers();
  if (users.find(u => u.email === email)) throw new Error('E-mail já cadastrado.');
  const newUser = { id: `u_${Date.now()}`, name, email, phone: phone || '', password };
  users.push(newUser);
  await saveUsers(users);
  const token = `local_${Date.now()}_${newUser.id}`;
  await saveToken(token);
  const safeUser = { id: newUser.id, name, email, phone: phone || '' };
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(safeUser));
  return { token, user: safeUser };
}

export async function getSavedUser() {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── API fetch (com fallback offline) ────────────────────────
export async function apiFetch(path, options = {}) {
  const token = await getToken();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Erro ${res.status}`);
    }
    return res.json();
  } catch (e) {
    // Se falhar por rede, retorna dados locais
    if (e.message?.includes('Network') || e.message?.includes('fetch')) {
      return getLocalData(path);
    }
    throw e;
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Dados locais (catálogo offline) ─────────────────────────
function getLocalData(path) {
  if (path.startsWith('/products')) return { products: LOCAL_PRODUCTS };
  if (path.startsWith('/categories')) return { categories: LOCAL_CATEGORIES };
  if (path.startsWith('/orders')) return { orders: [] };
  return {};
}

export const LOCAL_CATEGORIES = [
  { id: 'c1', name: 'Sensores', icon: '📡' },
  { id: 'c2', name: 'Módulos', icon: '🔌' },
  { id: 'c3', name: 'Displays', icon: '🖥️' },
  { id: 'c4', name: 'Motores', icon: '⚙️' },
  { id: 'c5', name: 'Cabos', icon: '🔗' },
  { id: 'c6', name: 'Ferramentas', icon: '🔧' },
];

export const LOCAL_PRODUCTS = [
  { id: 'p1',  name: 'Arduino Uno R3',           category: 'c2', price: 45.90,  originalPrice: 59.90,  image: '🤖', rating: 4.8, reviews: 312, stock: 50, isNew: false, isFeatured: true,  description: 'Microcontrolador ATmega328P, ideal para prototipagem.' },
  { id: 'p2',  name: 'Sensor Ultrassônico HC-SR04', category: 'c1', price: 12.90,  originalPrice: null,   image: '📡', rating: 4.6, reviews: 189, stock: 120, isNew: false, isFeatured: true,  description: 'Medição de distância de 2 cm a 4 m com precisão.' },
  { id: 'p3',  name: 'Display OLED 0.96"',        category: 'c3', price: 22.50,  originalPrice: 28.00,  image: '🖥️', rating: 4.7, reviews: 97,  stock: 30, isNew: true,  isFeatured: true,  description: 'Display I2C 128x64 pixels, alto contraste.' },
  { id: 'p4',  name: 'Motor de Passo 28BYJ-48',   category: 'c4', price: 18.00,  originalPrice: null,   image: '⚙️', rating: 4.4, reviews: 74,  stock: 45, isNew: false, isFeatured: false, description: 'Motor de passo unipolar com driver ULN2003.' },
  { id: 'p5',  name: 'Módulo Bluetooth HC-05',    category: 'c2', price: 29.90,  originalPrice: 39.90,  image: '🔵', rating: 4.5, reviews: 215, stock: 60, isNew: false, isFeatured: true,  description: 'Comunicação serial Bluetooth 2.0 para projetos wireless.' },
  { id: 'p6',  name: 'Sensor de Temperatura DHT22', category: 'c1', price: 19.90,  originalPrice: null,   image: '🌡️', rating: 4.9, reviews: 403, stock: 80, isNew: false, isFeatured: true,  description: 'Medição de temperatura e umidade relativa.' },
  { id: 'p7',  name: 'Módulo Wi-Fi ESP8266',       category: 'c2', price: 15.90,  originalPrice: 21.00,  image: '📶', rating: 4.6, reviews: 528, stock: 100, isNew: false, isFeatured: false, description: 'Módulo IoT com TCP/IP stack integrado.' },
  { id: 'p8',  name: 'Display LCD 16x2 I2C',       category: 'c3', price: 17.50,  originalPrice: null,   image: '📟', rating: 4.3, reviews: 143, stock: 55, isNew: false, isFeatured: false, description: 'Display de texto 16 colunas x 2 linhas com backlight.' },
  { id: 'p9',  name: 'Servo Motor SG90',           category: 'c4', price: 14.90,  originalPrice: 18.00,  image: '🔩', rating: 4.5, reviews: 267, stock: 90, isNew: false, isFeatured: false, description: 'Mini servo 9g, torque 1.8 kg/cm, ideal para robótica.' },
  { id: 'p10', name: 'Cabo USB-A para USB-B',      category: 'c5', price: 8.90,   originalPrice: null,   image: '🔗', rating: 4.2, reviews: 55,  stock: 200, isNew: false, isFeatured: false, description: 'Cabo para programação de Arduino, 1 metro.' },
  { id: 'p11', name: 'Kit Jumpers 65 pçs',         category: 'c5', price: 11.90,  originalPrice: 15.90,  image: '🧵', rating: 4.7, reviews: 381, stock: 150, isNew: false, isFeatured: false, description: 'Jumpers macho-macho, macho-fêmea e fêmea-fêmea.' },
  { id: 'p12', name: 'Multímetro Digital DT-830B', category: 'c6', price: 39.90,  originalPrice: 55.00,  image: '🔧', rating: 4.4, reviews: 112, stock: 25, isNew: true,  isFeatured: true,  description: 'Medição de tensão, corrente e resistência.' },
];