import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, auth, db } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Profile Cache Key
  const CACHE_KEY = 'scholara_user_profile';

  // Inisialisasi state otentikasi
  useEffect(() => {
    let mounted = true;

    // Listen for connectivity changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const initAuth = async () => {
      console.log('Auth: Initializing...');
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error('Session fetch error:', error);
          // Don't throw, just log and continue to set loading false
        }

        if (session?.user) {
          console.log('Auth: Session found', session.user.id);
          setUser(session.user);

          // Coba ambil dari cache dulu jika offline atau untuk kecepatan
          const cachedProfile = localStorage.getItem(CACHE_KEY);
          if (cachedProfile) {
            setProfile(JSON.parse(cachedProfile));
          }

          await fetchProfile(session.user.id);
        } else {
          console.log('Auth: No session found');
          setUser(null);
          setProfile(null);
          localStorage.removeItem(CACHE_KEY);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
      } finally {
        if (mounted) {
          console.log('Auth: Initialization complete, setting loading=false');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Debug URL hash
    if (window.location.hash) {
      console.log('Auth: Detected hash in URL:', window.location.hash.substring(0, 20) + '...');
    }

    // Dengarkan perubahan auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth: State change event', event);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        console.log('Auth: User signed in, fetching profile...');
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        if (!profileData) {
          console.warn('Auth: Profile still missing after retries.');
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('Auth: User signed out');
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ambil profil pengguna
  const fetchProfile = async (userId, retries = 3) => {
    try {
      // Jika offline, jangan panggil DB, andalkan cache yang sudah ada atau biarkan null
      if (!navigator.onLine) {
        console.log('Auth: Offline, skipping live profile fetch');
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
        return null;
      }

      const { data, error } = await db.getProfile(userId);

      // Jika profil tidak ditemukan dan sisa retries ada (kemungkinan delay Trigger), tunggu dan coba lagi
      if (!data && retries > 0) {
        console.log(`Profile not found yet, retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Increased wait time
        return fetchProfile(userId, retries - 1);
      }

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

      if (data) {
        setProfile(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  // Fungsi masuk (sign in)
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;

      setUser(data.user);
      const userProfile = await fetchProfile(data.user.id);

      return { success: true, role: userProfile?.role };
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Masuk dengan Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await auth.signInWithGoogle();
      if (error) throw error;
      // Redirect ditangani oleh Supabase OAuth
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi daftar (sign up)
  const signUp = async (email, password, fullName, school, role = 'siswa') => {
    try {
      setError(null);
      setLoading(true);

      // Daftar pengguna dengan metadata
      const { data: authData, error: authError } = await auth.signUp(email, password, {
        data: {
          full_name: fullName,
          school: school,
          role: role,
        },
      });
      if (authError) throw authError;

      setUser(authData.user);
      if (authData.user) {
        // Tunggu jeda sebentar untuk trigger
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let { data: checkProfile } = await db.getProfile(authData.user.id);

        if (!checkProfile) {
          console.warn('Trigger based profile creation failed or too slow. Attempting manual creation...');
          // Fallback: Buat profil secara manual
          const { error: manualProfileError } = await db.createProfile({
            id: authData.user.id,
            full_name: fullName,
            school: school,
            role: role,
          });

          if (manualProfileError) {
            console.error('Manual profile creation fallback failed:', manualProfileError);
          }
        }

        const userProfile = await fetchProfile(authData.user.id);
        return { success: true, role: userProfile?.role };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi keluar (sign out)
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      localStorage.removeItem(CACHE_KEY);

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Cek apakah pengguna memiliki peran tertentu
  const hasRole = (role) => {
    return profile?.role === role;
  };

  // Cek apakah pengguna adalah admin
  const isAdmin = () => hasRole('admin');

  // Cek apakah pengguna adalah siswa
  const isStudent = () => hasRole('siswa');

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    isStudent,
    isOnline,
    fetchProfile,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
