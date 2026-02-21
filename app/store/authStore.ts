// app/store/authStore.ts
import { supabase } from '@/utils/supabase';
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // ✅ SIGNUP
  signUp: async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        // Update profile with full name
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id);

        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
          },
          isAuthenticated: true,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  // ✅ SIGNIN
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };

      if (data.user) {
        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: profile?.full_name || '',
          },
          isAuthenticated: true,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  // ✅ SIGNOUT
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  // ✅ LOAD SESSION on app start
  loadSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: {
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || '',
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
