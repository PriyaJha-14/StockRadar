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

  // ✅ SIGNUP — trigger handles profile + cash creation automatically
  signUp: async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }, // trigger reads this for full_name
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        // Small delay to let the trigger finish creating profile
        await new Promise(resolve => setTimeout(resolve, 800));

        // Fetch the auto-created profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError.message);
        }

        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: profile?.full_name || fullName,
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
        // Load profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile load error:', profileError.message);
        }

        // Load virtual cash balance (column is 'cash' not 'amount')
        const { data: cashData, error: cashError } = await supabase
          .from('virtual_cash')
          .select('cash')
          .eq('user_id', data.user.id)
          .single();

        if (cashError) {
          console.error('Cash load error:', cashError.message);
        }

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
        // Load profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Session profile load error:', profileError.message);
        }

        // Load virtual cash (column is 'cash' not 'amount')
        const { data: cashData, error: cashError } = await supabase
          .from('virtual_cash')
          .select('cash')
          .eq('user_id', session.user.id)
          .single();

        if (cashError) {
          console.error('Session cash load error:', cashError.message);
        }

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
    } catch (err: any) {
      console.error('Load session error:', err.message);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
