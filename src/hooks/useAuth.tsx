import { useState, useEffect, useRef, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  restaurant_id: string | null;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'employee';
  phone: string | null;
  is_active: boolean;
  permissions: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_radius: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  restaurant: Restaurant | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  restaurant: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching profile (attempt ${attempts + 1}):`, error);
          attempts++;
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }
          return null;
        }

        return data;
      } catch (error) {
        console.error(`Error fetching profile (attempt ${attempts + 1}):`, error);
        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
        return null;
      }
    }
    return null;
  };

  const fetchRestaurant = async (restaurantId: string): Promise<Restaurant | null> => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .maybeSingle();

        if (error) {
          console.error(`Error fetching restaurant (attempt ${attempts + 1}):`, error);
          attempts++;
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }
          return null;
        }

        return data;
      } catch (error) {
        console.error(`Error fetching restaurant (attempt ${attempts + 1}):`, error);
        attempts++;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
        return null;
      }
    }
    return null;
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
    
    if (profileData?.restaurant_id) {
      const restaurantData = await fetchRestaurant(profileData.restaurant_id);
      setRestaurant(restaurantData);
    } else {
      setRestaurant(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let isInitialized = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event);
        
        // Handle token refresh errors - clean up corrupted sessions
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed - clearing session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setRestaurant(null);
          setLoading(false);
          return;
        }

        // Handle sign out or session expiration
        if (event === 'SIGNED_OUT' || (!session && isInitialized)) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRestaurant(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to prevent deadlock
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              const profileData = await fetchProfile(session.user.id);
              if (isMounted) {
                setProfile(profileData);
                
                if (profileData?.restaurant_id) {
                  const restaurantData = await fetchRestaurant(profileData.restaurant_id);
                  if (isMounted) {
                    setRestaurant(restaurantData);
                  }
                } else {
                  setRestaurant(null);
                }
              }
            } catch (error) {
              console.warn('Profile fetch failed during auth change:', error);
              if (isMounted) {
                setProfile(null);
                setRestaurant(null);
              }
            }
            if (isMounted) {
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setRestaurant(null);
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        // Handle invalid/corrupted session
        if (error) {
          console.warn('Session error - signing out:', error.message);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setRestaurant(null);
          setLoading(false);
          isInitialized = true;
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profileData);
              
              if (profileData?.restaurant_id) {
                const restaurantData = await fetchRestaurant(profileData.restaurant_id);
                if (isMounted) {
                  setRestaurant(restaurantData);
                }
              } else {
                setRestaurant(null);
              }
            }
          } catch (error) {
            console.warn('Profile fetch failed during session check:', error);
            if (isMounted) {
              setProfile(null);
              setRestaurant(null);
            }
          }
        } else {
          setProfile(null);
          setRestaurant(null);
        }

        if (isMounted) {
          setLoading(false);
          isInitialized = true;
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (isMounted) {
          // On any error, clean up and stop loading
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
          setUser(null);
          setProfile(null);
          setRestaurant(null);
          setLoading(false);
          isInitialized = true;
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    session,
    profile,
    restaurant,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};