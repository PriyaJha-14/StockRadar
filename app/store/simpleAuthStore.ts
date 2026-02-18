// app/store/simpleAuthStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  password: string;
  is2FAEnabled: boolean;
  portfolio: any[];
  watchlist: string[];
  chatHistory: any[];
  trades: any[];
  virtualCash: number;
  createdAt: string;
}

interface AuthState {
  currentUser: User | null;
  users: User[];
  pendingVerification: { email: string; code: string } | null;
  isAuthenticated: boolean;
  
  // Actions
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ needsOTP: boolean }>;
  signOut: () => Promise<void>;
  enable2FA: (email: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<boolean>;
  loadUsers: () => Promise<void>;
  
  // User Data Management
  syncUserData: (userId: string, data: Partial<User>) => Promise<void>;
  getUserData: (userId: string) => Promise<User | null>;
  updatePortfolio: (portfolio: any[]) => Promise<void>;
  updateWatchlist: (watchlist: string[]) => Promise<void>;
  updateChatHistory: (chatHistory: any[]) => Promise<void>;
  updateVirtualCash: (cash: number) => Promise<void>;
  addTrade: (trade: any) => Promise<void>;
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const useSimpleAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: [],
  pendingVerification: null,
  isAuthenticated: false,

  loadUsers: async () => {
    try {
      const stored = await AsyncStorage.getItem('users');
      const users = stored ? JSON.parse(stored) : [];
      set({ users });
      
      // Check if user was logged in
      const currentUserId = await AsyncStorage.getItem('currentUserId');
      if (currentUserId) {
        const user = users.find((u: User) => u.id === currentUserId);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          console.log('✅ User auto-logged in:', user.email);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  },

  signUp: async (email: string, password: string) => {
    const { users } = get();
    
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: generateUserId(),
      email,
      password,
      is2FAEnabled: false,
      portfolio: [],
      watchlist: [],
      chatHistory: [],
      trades: [],
      virtualCash: 100000,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    await AsyncStorage.setItem('currentUserId', newUser.id);
    
    set({ 
      users: updatedUsers, 
      currentUser: newUser,
      isAuthenticated: true 
    });
    
    console.log('✅ User signed up:', newUser.email);
  },

  signIn: async (email: string, password: string) => {
    const { users } = get();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.is2FAEnabled) {
      const code = generateOTP();
      set({ pendingVerification: { email, code } });
      console.log(`📧 OTP Code for ${email}: ${code}`);
      return { needsOTP: true };
    }

    await AsyncStorage.setItem('currentUserId', user.id);
    set({ 
      currentUser: user,
      isAuthenticated: true 
    });
    
    console.log('✅ User signed in:', user.email);
    return { needsOTP: false };
  },

  enable2FA: async (email: string) => {
    const { users, currentUser } = get();
    
    if (!currentUser || currentUser.email !== email) {
      throw new Error('No matching user');
    }
    
    const updatedUsers = users.map(u =>
      u.email === email ? { ...u, is2FAEnabled: true } : u
    );
    
    const updatedCurrentUser = { ...currentUser, is2FAEnabled: true };
    
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    set({ 
      users: updatedUsers,
      currentUser: updatedCurrentUser 
    });
  },

  verifyOTP: async (code: string) => {
    const { pendingVerification, users } = get();
    
    if (!pendingVerification) {
      throw new Error('No pending verification');
    }

    if (code === pendingVerification.code) {
      const user = users.find(u => u.email === pendingVerification.email);
      if (user) {
        await AsyncStorage.setItem('currentUserId', user.id);
        set({ 
          currentUser: user,
          pendingVerification: null,
          isAuthenticated: true 
        });
        console.log('✅ 2FA verified:', user.email);
      }
      return true;
    }

    return false;
  },

  signOut: async () => {
    await AsyncStorage.removeItem('currentUserId');
    set({ 
      currentUser: null,
      pendingVerification: null,
      isAuthenticated: false 
    });
    console.log('✅ User signed out');
  },

  // User Data Management
  syncUserData: async (userId: string, data: Partial<User>) => {
    const { users } = get();
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, ...data } : u
    );
    
    await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
    set({ users: updatedUsers });
    
    const { currentUser } = get();
    if (currentUser && currentUser.id === userId) {
      set({ currentUser: { ...currentUser, ...data } });
    }
  },

  getUserData: async (userId: string) => {
    const { users } = get();
    return users.find(u => u.id === userId) || null;
  },

  updatePortfolio: async (portfolio: any[]) => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    await get().syncUserData(currentUser.id, { portfolio });
    console.log('💾 Portfolio synced to cloud');
  },

  updateWatchlist: async (watchlist: string[]) => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    await get().syncUserData(currentUser.id, { watchlist });
    console.log('💾 Watchlist synced to cloud');
  },

  updateChatHistory: async (chatHistory: any[]) => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    await get().syncUserData(currentUser.id, { chatHistory });
    console.log('💾 Chat history synced to cloud');
  },

  updateVirtualCash: async (cash: number) => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    await get().syncUserData(currentUser.id, { virtualCash: cash });
    console.log('💾 Virtual cash synced:', cash);
  },

  addTrade: async (trade: any) => {
    const { currentUser } = get();
    if (!currentUser) return;
    
    const trades = [...(currentUser.trades || []), trade];
    await get().syncUserData(currentUser.id, { trades });
    console.log('💾 Trade recorded:', trade.type, trade.symbol);
  },
}));
