// src/services/api.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Troque pelos seus dados do Supabase (Project Settings → API)
const SUPABASE_URL  = 'https://vatkfhvvwkrherfpjcoy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGtmaHZ2d2tyaGVyZnBqY295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODU0ODgsImV4cCI6MjA5NDg2MTQ4OH0.8ggmSoUHhrSH2OtRP8KjfKF1bYNc5kSXn-Sk5V5Iui0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});

// ── Formatador de preço ──────────────────────────────────────
export function fmtPrice(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

// ── Auth ──────────────────────────────────────────────────────
export async function loginSupabase({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data?.user) throw new Error('Usuário não encontrado.');
  const profile = await getProfile(data.user.id);
  return { user: buildUser(data.user, profile) };
}

export async function registerSupabase({ name, email, password, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone: phone || '' } },
  });
  if (error) throw new Error(error.message);

  // Se confirmação de e-mail estiver ativa, data.user existe mas session é null
  // Tentamos fazer login direto depois do registro
  let authUser = data?.user;
  if (!authUser) throw new Error('Erro ao criar conta. Tente novamente.');

  // Tentar login automático após registro
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!loginError && loginData?.user) {
      authUser = loginData.user;
    }
  } catch {}

  // Aguardar um pouco para o trigger criar o perfil
  await new Promise(r => setTimeout(r, 800));

  const profile = await getProfile(authUser.id);
  return { user: buildUser(authUser, profile) };
}

export async function logoutSupabase() {
  await supabase.auth.signOut();
}

export async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const profile = await getProfile(session.user.id);
  return buildUser(session.user, profile);
}

async function getProfile(userId) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  } catch { return null; }
}

function buildUser(authUser, profile) {
  const name = profile?.name
    || authUser?.user_metadata?.name
    || authUser?.email?.split('@')[0]
    || 'Usuário';
  return {
    id:    authUser.id,
    email: authUser.email,
    name,
    phone: profile?.phone || authUser?.user_metadata?.phone || '',
    tag:   profile?.tag   || '🔧 Cliente ASR',
    avatar: name[0]?.toUpperCase() || 'U',
    stats: {
      orders:     profile?.orders_count || 0,
      totalSpent: profile?.total_spent  || 0,
      points:     profile?.points       || 0,
    },
  };
}

// ── Carrinho ──────────────────────────────────────────────────
export async function getCartFromDb(userId) {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId);
  if (error) return [];
  return (data || []).map(row => {
    const product = LOCAL_PRODUCTS.find(p => p.id === row.product_id);
    return product ? { ...product, qty: row.qty } : null;
  }).filter(Boolean);
}

export async function upsertCartItem(userId, productId, qty) {
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, qty },
      { onConflict: 'user_id,product_id' }
    );
  if (error) throw error;
}

export async function deleteCartItem(userId, productId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  if (error) throw error;
}

export async function clearCartDb(userId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Pedidos ───────────────────────────────────────────────────
export async function saveOrderDb(userId, order) {
  const { error } = await supabase.from('orders').insert({
    user_id:  userId,
    order_id: order.orderId,
    items:    order.items,
    total:    order.total,
    status:   order.status,
    payment:  order.payment || 'cartão',
    address:  order.address || 'Endereço principal',
  });
  if (error) throw error;

  // Atualizar stats
  const { data: profile } = await supabase
    .from('profiles').select('orders_count,total_spent,points').eq('id', userId).single();
  if (profile) {
    await supabase.from('profiles').update({
      orders_count: (profile.orders_count || 0) + 1,
      total_spent:  (profile.total_spent  || 0) + order.total,
      points:       (profile.points       || 0) + Math.floor(order.total / 10),
    }).eq('id', userId);
  }
}

export async function getOrdersDb(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(o => ({
    orderId:   o.order_id,
    items:     o.items,
    total:     o.total,
    status:    o.status,
    createdAt: o.created_at,
  }));
}

// ── Categorias ────────────────────────────────────────────────
export const CATEGORIES = [
  'Todos', 'Elétrica', 'Motor', 'Iluminação', 'Bateria',
  'Freios', 'Suspensão', 'Ar Cond.', 'Módulos',
];

// ── Produtos locais ───────────────────────────────────────────
export const LOCAL_PRODUCTS = [
  { id:1,  emoji:'⚡', brand:'Bosch',   name:'Módulo de Ignição Universal',    price:289.90, oldPrice:350.00, badge:'−17%', cat:'Elétrica',   rating:4.8, reviews:234, stock:18, description:'Módulo de ignição de alta performance compatível com a maioria dos motores nacionais.' },
  { id:2,  emoji:'🔌', brand:'Delphi',  name:'Sensor MAP de Pressão 1 Bar',    price:124.50, oldPrice:null,   badge:'Novo',  cat:'Elétrica',   rating:4.6, reviews:89,  stock:35, description:'Sensor de pressão absoluta do coletor (MAP) com alta precisão.' },
  { id:3,  emoji:'🕯️', brand:'NGK',     name:'Velas de Ignição Iridium Gx8',  price:68.00,  oldPrice:85.00,  badge:'−20%', cat:'Motor',      rating:4.9, reviews:567, stock:80, description:'Velas de ignição com eletrodo de iridium. Partida mais fácil, menor consumo.' },
  { id:4,  emoji:'💡', brand:'Osram',   name:'Kit LED H4 6000K 8000lm',        price:199.90, oldPrice:240.00, badge:'−17%', cat:'Iluminação', rating:4.7, reviews:312, stock:22, description:'Kit completo de faróis LED H4 6000K com 8000 lumens. Plug-and-play.' },
  { id:5,  emoji:'🔋', brand:'Moura',   name:'Bateria 60Ah Selada MF60',       price:389.00, oldPrice:null,   badge:'',     cat:'Bateria',    rating:4.5, reviews:145, stock:10, description:'Bateria selada livre de manutenção com 60Ah. Alta vida útil.' },
  { id:6,  emoji:'❄️', brand:'Valeo',   name:'Compressor Ar-Cond. Universal',  price:650.00, oldPrice:780.00, badge:'−17%', cat:'Ar Cond.',   rating:4.4, reviews:76,  stock:6,  description:'Compressor de ar condicionado universal com alta eficiência energética.' },
  { id:7,  emoji:'🔩', brand:'Monroe',  name:'Amortecedor Dianteiro Par',      price:310.00, oldPrice:380.00, badge:'−18%', cat:'Suspensão',  rating:4.6, reviews:198, stock:14, description:'Par de amortecedores dianteiros a gás de alta performance.' },
  { id:8,  emoji:'🛞', brand:'Fremax',  name:'Disco de Freio Ventilado 280mm', price:175.00, oldPrice:null,   badge:'Novo',  cat:'Freios',     rating:4.8, reviews:423, stock:28, description:'Disco de freio ventilado de alta performance com 280mm de diâmetro.' },
  { id:9,  emoji:'📱', brand:'Magneti', name:'Módulo BSI Completo 508',        price:820.00, oldPrice:1050.00,badge:'−22%', cat:'Módulos',    rating:4.3, reviews:54,  stock:4,  description:'Módulo BSI completo para Peugeot 508. Programado e testado.' },
  { id:10, emoji:'⚙️', brand:'Mahle',   name:'Kit Filtros Completo Motor',     price:145.00, oldPrice:160.00, badge:'',     cat:'Motor',      rating:4.7, reviews:302, stock:55, description:'Kit completo de filtros para motor incluindo óleo, ar, combustível e cabine.' },
];