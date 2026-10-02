import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured, User, Session } from '../lib/supabase/client';
import { SupabaseDb } from '../lib/supabase/db';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  /** @deprecated Google sign-in is not supported. Kept to avoid compile errors. */
  signInWithGoogle: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Initialise or sync a user profile row in Supabase
  const initProfile = async (authUser: User) => {
    try {
      const cloud = await SupabaseDb.getProfile(authUser.id);

      const displayName =
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        'User';

      if (cloud) {
        setProfile({
          id: authUser.id,
          name: cloud.display_name || displayName,
          email: authUser.email,
          avatarType: cloud.avatar_type || 'preset',
          presetId: (cloud.preset_id as any) || 'anime',
          customAvatarDataUrl: cloud.avatar_url || undefined,
        });
      } else {
        // First login — provision the profile row
        const initialProfile: UserProfile = {
          id: authUser.id,
          name: displayName,
          email: authUser.email,
          avatarType: 'preset',
          presetId: 'anime',
        };

        await SupabaseDb.upsertProfile(authUser.id, {
          display_name: displayName,
          email: authUser.email,
          avatar_type: 'preset',
          preset_id: 'anime',
          avatar_url: null,
        });

        setProfile(initialProfile);
      }
    } catch (e) {
      console.warn('Profile initialisation warning:', e);
    } finally {
      setLoading(false);
    }
  };

  // Sync Supabase auth state on mount
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (!error && currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        initProfile(currentSession.user);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await initProfile(newSession.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Auth methods ---

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Check your .env settings.' };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message ?? 'Unexpected sign-in error.' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Check your .env settings.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) return { error: error.message };

      // Email confirmation required when user exists but session is null
      if (data.user && !data.session) {
        return { error: null, needsConfirmation: true };
      }

      return { error: null, needsConfirmation: false };
    } catch (err: any) {
      return { error: err?.message ?? 'Unexpected sign-up error.' };
    }
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign-out error:', e);
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured) {
      return { error: 'Supabase is not configured. Check your .env settings.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message ?? 'Unexpected error sending reset email.' };
    }
  };

  /** @deprecated Google sign-in is not supported. Stub kept to avoid compile errors. */
  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    return { error: 'Google sign-in is not supported.' };
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await initProfile(user);
    }
  };

  const updateProfileData = async (
    updates: Partial<UserProfile>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await SupabaseDb.upsertProfile(user.id, {
        display_name: updates.name,
        avatar_type: updates.avatarType,
        preset_id: updates.presetId,
        avatar_url: updates.customAvatarDataUrl,
      });

      if (success) {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating profile:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        profile,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        refreshProfile,
        updateProfileData,}}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
