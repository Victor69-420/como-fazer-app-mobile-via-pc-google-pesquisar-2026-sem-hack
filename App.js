// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';

import AuthScreen         from './src/screens/AuthScreen';
import HomeScreen         from './src/screens/HomeScreen';
import ProductsScreen     from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen         from './src/screens/CartScreen';
import SearchScreen       from './src/screens/SearchScreen';
import ProfileScreen      from './src/screens/ProfileScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Stack dentro de cada tab ─────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Início' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Produto' }} />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} options={{ title: 'Catálogo' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Produto' }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="CartMain" component={CartScreen} options={{ title: 'Carrinho' }} />
      <Stack.Screen name="Products"  component={ProductsScreen} options={{ title: 'Catálogo' }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="SearchMain" component={SearchScreen} options={{ title: 'Buscar' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Produto' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Stack.Navigator>
  );
}

// ── Tab icon helper ──────────────────────────────────────────
function TabIcon({ emoji, color, count }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, opacity: 1 }}>{emoji}</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main Tabs ────────────────────────────────────────────────
function MainTabs() {
  const { cartCount } = useApp();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg2,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.text3,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home" component={HomeStack}
        options={{ tabBarLabel: 'Início', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tab.Screen
        name="Products" component={ProductsStack}
        options={{ tabBarLabel: 'Catálogo', tabBarIcon: ({ color }) => <TabIcon emoji="🔧" color={color} /> }}
      />
      <Tab.Screen
        name="Cart" component={CartStack}
        options={{ tabBarLabel: 'Carrinho', tabBarIcon: ({ color }) => <TabIcon emoji="🛒" color={color} count={cartCount} /> }}
      />
      <Tab.Screen
        name="Search" component={SearchStack}
        options={{ tabBarLabel: 'Buscar', tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} /> }}
      />
      <Tab.Screen
        name="Profile" component={ProfileStack}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

// ── Root navigator (Auth gate) ───────────────────────────────
function RootNavigator() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🔧</Text>
        <Text style={styles.splashName}>ASR Eletrônica</Text>
        <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={{ colors: { background: colors.bg } }}>
      {user ? <MainTabs /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ── Shared stack options ─────────────────────────────────────
const stackOpts = {
  headerStyle: { backgroundColor: colors.bg2 },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  splashEmoji: { fontSize: 64, marginBottom: 12 },
  splashName: { fontSize: 28, fontWeight: '800', color: colors.text },
  badge: {
    position: 'absolute', top: -4, right: -10,
    backgroundColor: colors.orange, borderRadius: 8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
