# ASR Eletrônica – React Native App 🔧⚡

App mobile nativo gerado a partir do projeto HTML/Express original.

## Estrutura

```
ASREletronica/
├── App.js                    ← Navegação raiz + Auth gate
├── babel.config.js
├── package.json
└── src/
    ├── context/
    │   └── AppContext.js     ← Auth, carrinho e estado global
    ├── screens/
    │   ├── AuthScreen.js     ← Login + Cadastro
    │   ├── HomeScreen.js     ← Home com banner, categorias, destaques
    │   ├── ProductsScreen.js ← Catálogo com filtros e ordenação
    │   ├── ProductDetailScreen.js ← Detalhe do produto
    │   ├── CartScreen.js     ← Carrinho com qty + checkout
    │   ├── SearchScreen.js   ← Busca em tempo real
    │   └── ProfileScreen.js  ← Perfil, pedidos, logout
    ├── components/
    │   └── index.js          ← Button, InputField, ProductCard, Avatar, Toast
    ├── services/
    │   └── api.js            ← apiFetch, token, dados locais (offline)
    └── theme/
        └── index.js          ← Colors, spacing, radius
```

## 🚀 Como rodar

### 1. Pré-requisitos
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- App **Expo Go** no celular (iOS ou Android)

### 2. Instalar dependências
```bash
cd ASREletronica
npm install
```

### 3. Configurar o IP do servidor
Edite `src/services/api.js` e ajuste:
```js
export const API_BASE = 'http://SEU_IP_LOCAL:3001/api';
// Exemplo: 'http://192.168.1.100:3001/api'
```
> ⚠️ Use o IP da sua rede Wi-Fi, não `localhost` (o celular não enxerga o localhost do PC).

### 4. Iniciar o backend
```bash
# Na pasta do projeto original
npm start
```

### 5. Iniciar o app React Native
```bash
npx expo start
```
Escaneie o QR code com o app **Expo Go**.

---

## 📱 Telas

| Tela | Descrição |
|------|-----------|
| Login/Cadastro | Autenticação com token JWT via API |
| Home | Banner, categorias, produtos em destaque e novidades |
| Catálogo | Grid com filtro por categoria e ordenação |
| Detalhe | Fotos, preço, qty, adicionar ao carrinho |
| Carrinho | Lista, ajuste de qtd, frete, checkout |
| Busca | Busca em tempo real com debounce |
| Perfil | Dados do usuário, estatísticas, histórico de pedidos |

## 🎨 Design

- Tema dark premium com laranja `#FF6B1A`
- Modo offline automático com dados locais se a API não responder
- Token armazenado com `expo-secure-store` (criptografado)

---
*ASR Eletrônica © 2025*
