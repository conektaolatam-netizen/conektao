import { useState, useEffect, createContext, useContext } from "react";
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

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const fetchRestaurant = async (restaurantId: string): Promise<Restaurant | null> => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching restaurant:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      return null;
    }
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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
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
      }
    });

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