import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  website: string;
  location: string;
  followers: number;
  following: number;
  posts: number;
  joinDate: string;
  verified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchProfileByUsername: (username: string) => Promise<User | null>;
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  searchUsers: (query: string) => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  const convertSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (profile) {
        return {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
          bio: profile.bio || '',
          githubUrl: profile.github_url || '',
          linkedinUrl: profile.linkedin_url || '',
          twitterUrl: profile.twitter_url || '',
          website: profile.website || '',
          location: profile.location || '',
          followers: profile.followers_count || 0,
          following: profile.following_count || 0,
          posts: profile.posts_count || 0,
          joinDate: new Date(profile.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }),
          verified: false, // You can add a verified field to the database later
        };
      } else {
        const username = supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user';
        return {
          id: supabaseUser.id,
          username,
          email: supabaseUser.email || '',
          avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
          bio: '',
          githubUrl: '',
          linkedinUrl: '',
          twitterUrl: '',
          website: '',
          location: '',
          followers: 0,
          following: 0,
          posts: 0,
          joinDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }),
          verified: false,
        };
      }
    } catch (error) {
      console.error('Error converting Supabase user:', error);
      return null;
    }
  };

  const fetchProfileByUsername = async (username: string): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Error fetching profile by username:', error);
        return null;
      }

      if (profile) {
        return {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          avatar: profile.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
          bio: profile.bio || '',
          githubUrl: profile.github_url || '',
          linkedinUrl: profile.linkedin_url || '',
          twitterUrl: profile.twitter_url || '',
          website: profile.website || '',
          location: profile.location || '',
          followers: profile.followers_count || 0,
          following: profile.following_count || 0,
          posts: profile.posts_count || 0,
          joinDate: new Date(profile.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }),
          verified: false,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in fetchProfileByUsername:', error);
      return null;
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Map User interface fields to database column names
      const updateData: any = {};
      
      if (profileData.username) updateData.username = profileData.username;
      if (profileData.email) updateData.email = profileData.email;
      if (profileData.bio !== undefined) updateData.bio = profileData.bio;
      if (profileData.location !== undefined) updateData.location = profileData.location;
      if (profileData.website !== undefined) updateData.website = profileData.website;
      if (profileData.githubUrl !== undefined) updateData.github_url = profileData.githubUrl;
      if (profileData.linkedinUrl !== undefined) updateData.linkedin_url = profileData.linkedinUrl;
      if (profileData.twitterUrl !== undefined) updateData.twitter_url = profileData.twitterUrl;
      if (profileData.avatar !== undefined) updateData.avatar_url = profileData.avatar;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      // Update the current user state
      const updatedUser = await convertSupabaseUser({ 
        id: user.id, 
        email: user.email,
        user_metadata: {}
      } as SupabaseUser);
      
      if (updatedUser) {
        setUser(updatedUser);
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      if (!query.trim()) {
        return [];
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return profiles.map(profile => ({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
        bio: profile.bio || '',
        githubUrl: profile.github_url || '',
        linkedinUrl: profile.linkedin_url || '',
        twitterUrl: profile.twitter_url || '',
        website: profile.website || '',
        location: profile.location || '',
        followers: profile.followers_count || 0,
        following: profile.following_count || 0,
        posts: profile.posts_count || 0,
        joinDate: new Date(profile.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        }),
        verified: false,
      }));
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return [];
    }
  };

  const isUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        return true;
      }
      return !data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const createUserProfile = async (supabaseUser: SupabaseUser, username: string): Promise<void> => {
    try {
      const { error } = await supabase.from('profiles').insert({
        id: supabaseUser.id,
        username,
        email: supabaseUser.email || '',
        avatar_url: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
        bio: 'New developer on InstaCode!',
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
      });

      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        let errorMessage = 'Login failed. Please try again.';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        }
        return { success: false, error: errorMessage };
      }

      if (data.user && data.session) {
        const convertedUser = await convertSupabaseUser(data.user);
        if (convertedUser) {
          setUser(convertedUser);
          setIsAuthenticated(true);
          return { success: true };
        } else {
          return { success: false, error: 'Failed to load user profile. Please try again.' };
        }
      }

      return { success: false, error: 'Login failed. Please try again.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return {
          success: false,
          error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.',
        };
      }

      const usernameAvailable = await isUsernameAvailable(username);
      if (!usernameAvailable) {
        return { success: false, error: 'Username is already taken. Please choose a different username.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) {
        let errorMessage = 'Signup failed. Please try again.';
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Signup is disabled')) {
          errorMessage = 'Account creation is currently disabled. Please contact support.';
        }
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        try {
          await createUserProfile(data.user, username);
        } catch (profileError) {
          console.error('Error creating profile:', profileError);
        }

        if (data.session) {
          const convertedUser = await convertSupabaseUser(data.user);
          if (convertedUser) {
            setUser(convertedUser);
            setIsAuthenticated(true);
          }
        }

        return { success: true };
      }

      return { success: false, error: 'Signup failed. Please try again.' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          if (session?.user) {
            console.log('Session found, converting user...');
            const convertedUser = await convertSupabaseUser(session.user);
            if (convertedUser && mounted) {
              console.log('User converted successfully:', convertedUser.username);
              setUser(convertedUser);
              setIsAuthenticated(true);
            }
          } else {
            console.log('No session found');
          }
          
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        setLoading(true);

        if (session?.user) {
          const convertedUser = await convertSupabaseUser(session.user);
          if (convertedUser && mounted) {
            setUser(convertedUser);
            setIsAuthenticated(true);
          }
        } else {
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      initialized,
      loading,
      login, 
      signup, 
      logout, 
      fetchProfileByUsername, 
      updateProfile, 
      searchUsers 
    }}>
      {children}
    </AuthContext.Provider>
  );
};