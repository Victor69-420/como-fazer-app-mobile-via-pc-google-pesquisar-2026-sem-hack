// ═══════════════════════════════════════════════════════════
//  ASR Eletrônica – Auto Peças | Backend API
//  Node.js + Express + Auth | server.js
// ═══════════════════════════════════════════════════════════

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const crypto   = require('crypto');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════
//  BANCO DE DADOS DE USUÁRIOS (arquivo JSON persistente)
// ═══════════════════════════════════════════════════════════

const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'asr_salt_2025').digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Sessões ativas em memória { token -> { userId, expiresAt } }
const activeSessions = new Map();

function createSession(userId) {
  const token     = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
  activeSessions.set(token, { userId, expiresAt });
  return token;
}

function validateSession(token) {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) { activeSessions.delete(token); return null; }
  return session.userId;
}

function requireAuth(req, res, next) {
  const token  = req.headers.authorization?.replace('Bearer ', '');
  const userId = validateSession(token);
  if (!userId) return res.status(401).json({ success: false, message: 'Não autenticado. Faça login.' });
  req.userId = userId;
  next();
}

// ═══════════════════════════════════════════════════════════
//  ROTAS – AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'E-mail inválido.' });

  const users  = loadUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado.' });

  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const newUser  = {
    id:        crypto.randomUUID(),
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    phone:     phone || '',
    password:  hashPassword(password),
    avatar:    initials,
    tag:       '🔧 Cliente ASR',
    stats:     { orders: 0, totalSpent: 0, points: 0 },
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const token = createSession(newUser.id);
  const { password: _pw, ...safe } = newUser;
  res.status(201).json({ success: true, message: `Bem-vindo(a), ${newUser.name}!`, token, user: safe });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });

  const users = loadUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== hashPassword(password))
    return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });

  const token = createSession(user.id);
  const { password: _pw, ...safe } = user;
  res.json({ success: true, message: `Bem-vindo(a) de volta, ${user.name}!`, token, user: safe });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) activeSessions.delete(token);
  res.json({ success: true, message: 'Sessão encerrada.' });
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  const users = loadUsers();
  const user  = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  const { password: _pw, ...safe } = user;
  res.json({ success: true, user: safe });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { name, phone } = req.body;
  const users = loadUsers();
  const idx   = users.findIndex(u => u.id === req.userId);
  if (idx < 0) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  if (name)             { users[idx].name = name.trim(); users[idx].avatar = name.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
  if (phone !== undefined) users[idx].phone = phone;
  saveUsers(users);
  const { password: _pw, ...safe } = users[idx];
  res.json({ success: true, message: 'Perfil atualizado!', user: safe });
});

// ═══════════════════════════════════════════════════════════
//  BASE DE DADOS – PRODUTOS
// ═══════════════════════════════════════════════════════════

const productsDB = [
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

// Carrinhos e pedidos separados por usuário
const cartsByUser  = new Map();
const ordersByUser = new Map();
let   nextCartId   = 1;

function getCart(uid)   { if (!cartsByUser.has(uid))  cartsByUser.set(uid, []);  return cartsByUser.get(uid); }
function getOrders(uid) { if (!ordersByUser.has(uid)) ordersByUser.set(uid, []); return ordersByUser.get(uid); }

// ═══════════════════════════════════════════════════════════
//  ROTAS – PRODUTOS (públicas)
// ═══════════════════════════════════════════════════════════

app.get('/api/products', (req, res) => {
  const { cat, q, sort } = req.query;
  let r = [...productsDB];
  if (cat && cat !== 'Todos') r = r.filter(p => p.cat.toLowerCase() === cat.toLowerCase());
  if (q) { const ql=q.toLowerCase(); r=r.filter(p=>p.name.toLowerCase().includes(ql)||p.brand.toLowerCase().includes(ql)||p.cat.toLowerCase().includes(ql)); }
  if (sort==='price_asc')  r.sort((a,b)=>a.price-b.price);
  if (sort==='price_desc') r.sort((a,b)=>b.price-a.price);
  if (sort==='rating')     r.sort((a,b)=>b.rating-a.rating);
  if (sort==='reviews')    r.sort((a,b)=>b.reviews-a.reviews);
  res.json({ success:true, total:r.length, products:r });
});

app.get('/api/products/featured',   (_,res) => res.json({ success:true, products:productsDB.slice(0,6) }));
app.get('/api/products/new',        (_,res) => res.json({ success:true, products:productsDB.slice(3,9) }));
app.get('/api/products/categories', (_,res) => {
  const cats = [...new Set(productsDB.map(p=>p.cat))];
  res.json({ success:true, categories: cats.map(c=>({ name:c, count:productsDB.filter(p=>p.cat===c).length, emoji:productsDB.find(p=>p.cat===c)?.emoji })) });
});
app.get('/api/products/:id', (req,res) => {
  const p = productsDB.find(p=>p.id===Number(req.params.id));
  if (!p) return res.status(404).json({ success:false, message:'Produto não encontrado' });
  res.json({ success:true, product:p });
});

// ═══════════════════════════════════════════════════════════
//  ROTAS – CARRINHO (requer autenticação)
// ═══════════════════════════════════════════════════════════

app.get('/api/cart', requireAuth, (req,res) => {
  const cart=getCart(req.userId);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const frete=total>=150?0:19.90;
  res.json({ success:true, items:cart, total, totalItems:cart.reduce((s,i)=>s+i.qty,0), frete, grandTotal:total+frete });
});

app.post('/api/cart', requireAuth, (req,res) => {
  const {productId,qty=1}=req.body;
  const product=productsDB.find(p=>p.id===Number(productId));
  if (!product) return res.status(404).json({ success:false, message:'Produto não encontrado' });
  const cart=getCart(req.userId);
  const ex=cart.find(i=>i.productId===product.id);
  if (ex) { ex.qty+=qty; ex.subtotal=+(ex.price*ex.qty).toFixed(2); }
  else cart.push({ cartItemId:nextCartId++, productId:product.id, emoji:product.emoji, brand:product.brand, name:product.name, price:product.price, qty, subtotal:+(product.price*qty).toFixed(2) });
  res.json({ success:true, message:'Item adicionado ao carrinho', cart });
});

app.put('/api/cart/:productId', requireAuth, (req,res) => {
  const {qty}=req.body; const id=Number(req.params.productId);
  if (qty<1) return res.status(400).json({ success:false, message:'Quantidade inválida' });
  const cart=getCart(req.userId); const item=cart.find(i=>i.productId===id);
  if (!item) return res.status(404).json({ success:false, message:'Item não encontrado no carrinho' });
  item.qty=qty; item.subtotal=+(item.price*qty).toFixed(2);
  res.json({ success:true, message:'Quantidade atualizada', item });
});

app.delete('/api/cart/:productId', requireAuth, (req,res) => {
  const id=Number(req.params.productId); const cart=getCart(req.userId);
  const idx=cart.findIndex(i=>i.productId===id);
  if (idx<0) return res.status(404).json({ success:false, message:'Item não encontrado' });
  cart.splice(idx,1);
  res.json({ success:true, message:'Item removido', cart });
});

app.delete('/api/cart', requireAuth, (req,res) => {
  cartsByUser.set(req.userId,[]);
  res.json({ success:true, message:'Carrinho limpo' });
});

// ═══════════════════════════════════════════════════════════
//  ROTAS – PEDIDOS (requer autenticação)
// ═══════════════════════════════════════════════════════════

app.post('/api/orders', requireAuth, (req,res) => {
  const cart=getCart(req.userId);
  if (!cart.length) return res.status(400).json({ success:false, message:'Carrinho vazio' });
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const frete=subtotal>=150?0:19.90;
  const total=subtotal+frete;
  const order={ orderId:`ASR-${Date.now()}`, createdAt:new Date().toISOString(), status:'confirmado', items:[...cart], subtotal:+subtotal.toFixed(2), frete, total:+total.toFixed(2), payment:req.body.payment||'cartão', address:req.body.address||'Endereço principal' };
  getOrders(req.userId).push(order);
  const users=loadUsers(); const idx=users.findIndex(u=>u.id===req.userId);
  if (idx>=0) { users[idx].stats.orders+=1; users[idx].stats.totalSpent=+(users[idx].stats.totalSpent+total).toFixed(2); users[idx].stats.points+=Math.floor(total/10); saveUsers(users); }
  cartsByUser.set(req.userId,[]);
  res.status(201).json({ success:true, message:'Pedido realizado com sucesso!', order });
});

app.get('/api/orders', requireAuth, (req,res) => {
  res.json({ success:true, orders:getOrders(req.userId) });
});

// ═══════════════════════════════════════════════════════════
//  ROTAS – PERFIL (requer autenticação)
// ═══════════════════════════════════════════════════════════

app.get('/api/profile', requireAuth, (req,res) => {
  const users=loadUsers(); const user=users.find(u=>u.id===req.userId);
  if (!user) return res.status(404).json({ success:false, message:'Usuário não encontrado.' });
  const {password:_pw,...safe}=user;
  res.json({ success:true, profile:safe });
});

// ═══════════════════════════════════════════════════════════
//  BUSCA GLOBAL (pública)
// ═══════════════════════════════════════════════════════════

app.get('/api/search', (req,res) => {
  const q=(req.query.q||'').toLowerCase().trim();
  const results=q ? productsDB.filter(p=>p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)) : productsDB;
  res.json({ success:true, query:q, total:results.length, results });
});


// ═══════════════════════════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════════════════════════

app.get('/api/health', (_,res) => {
  res.json({ success: true, status: 'online', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 ASR Eletrônica API → http://localhost:${PORT}`);
  console.log(`📦 ${productsDB.length} produtos | 🔐 Auth ativada | 💾 DB: ${USERS_FILE}`);
  console.log(`\n  POST  /api/auth/register`);
  console.log(`  POST  /api/auth/login`);
  console.log(`  POST  /api/auth/logout`);
  console.log(`  GET   /api/auth/me`);
  console.log(`  PUT   /api/auth/profile`);
});