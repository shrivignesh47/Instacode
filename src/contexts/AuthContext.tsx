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
  receiveFollowNotifications: boolean;
  receiveMessageNotifications: boolean;
  receivePostLikeNotifications: boolean;
  receivePostCommentNotifications: boolean;
  receiveNewPostFromFollowedNotifications: boolean;
  leetcodeUsername: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
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
  const [loading, setLoading] = useState(true);

  const createDefaultUser = (supabaseUser: SupabaseUser): User => {
    console.log('Creating default user for:', supabaseUser.id);
    return {
      id: supabaseUser.id,
      username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
      email: supabaseUser.email || '',
      avatar: 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
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
      receiveFollowNotifications: true,
      receiveMessageNotifications: true,
      receivePostLikeNotifications: true,
      receivePostCommentNotifications: true,
      receiveNewPostFromFollowedNotifications: true,
      leetcodeUsername: null,
    };
  };

  const convertSupabaseUser = async (supabaseUser: SupabaseUser): Promise<User> => {
    console.log('Converting Supabase user:', supabaseUser.id);
    
    try {
      // Increased timeout to 30 seconds and improved error handling
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 90000)
      );

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      console.log('Querying profiles table...');
      
      try {
        const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          console.log('Profile query error:', error.message);
          // If it's a "not found" error, create a default profile
          if (error.code === 'PGRST116') {
            console.log('Profile not found, creating default user');
            return createDefaultUser(supabaseUser);
          }
          console.log('Using default user due to error');
          return createDefaultUser(supabaseUser);
        }

        if (profile) {
          console.log('Profile found, converting to user object');
          return {
            id: profile.id,
            username: profile.username,
            email: profile.email,
            avatar: profile.avatar_url || 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
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
            receiveFollowNotifications: profile.receive_follow_notifications ?? true,
            receiveMessageNotifications: profile.receive_message_notifications ?? true,
            receivePostLikeNotifications: profile.receive_post_like_notifications ?? true,
            receivePostCommentNotifications: profile.receive_post_comment_notifications ?? true,
            receiveNewPostFromFollowedNotifications: profile.receive_new_post_from_followed_notifications ?? true,
            leetcodeUsername: profile.leetcode_username || null,
          };
        }

        console.log('No profile found, using default user');
        return createDefaultUser(supabaseUser);

      } catch (raceError) {
        console.error('Profile query race error:', raceError);
        console.log('Using default user due to race error');
        return createDefaultUser(supabaseUser);
      }

    } catch (error) {
      console.error('Error in convertSupabaseUser:', error);
      console.log('Using default user due to exception');
      return createDefaultUser(supabaseUser);
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
          avatar: profile.avatar_url || 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
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
          receiveFollowNotifications: profile.receive_follow_notifications ?? true,
          receiveMessageNotifications: profile.receive_message_notifications ?? true,
          receivePostLikeNotifications: profile.receive_post_like_notifications ?? true,
          receivePostCommentNotifications: profile.receive_post_comment_notifications ?? true,
          receiveNewPostFromFollowedNotifications: profile.receive_new_post_from_followed_notifications ?? true,
          leetcodeUsername: profile.leetcode_username || null,
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
      if (profileData.leetcodeUsername !== undefined) updateData.leetcode_username = profileData.leetcodeUsername;
      
      // Add notification preferences
      if (profileData.receiveFollowNotifications !== undefined) 
        updateData.receive_follow_notifications = profileData.receiveFollowNotifications;
      if (profileData.receiveMessageNotifications !== undefined) 
        updateData.receive_message_notifications = profileData.receiveMessageNotifications;
      if (profileData.receivePostLikeNotifications !== undefined) 
        updateData.receive_post_like_notifications = profileData.receivePostLikeNotifications;
      if (profileData.receivePostCommentNotifications !== undefined) 
        updateData.receive_post_comment_notifications = profileData.receivePostCommentNotifications;
      if (profileData.receiveNewPostFromFollowedNotifications !== undefined) 
        updateData.receive_new_post_from_followed_notifications = profileData.receiveNewPostFromFollowedNotifications;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      const updatedUser = await convertSupabaseUser({ 
        id: user.id, 
        email: user.email,
        user_metadata: {}
      } as SupabaseUser);
      
      setUser(updatedUser);
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
        .neq('id', user?.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return profiles.map(profile => ({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
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
        receiveFollowNotifications: profile.receive_follow_notifications ?? true,
        receiveMessageNotifications: profile.receive_message_notifications ?? true,
        receivePostLikeNotifications: profile.receive_post_like_notifications ?? true,
        receivePostCommentNotifications: profile.receive_post_comment_notifications ?? true,
        receiveNewPostFromFollowedNotifications: profile.receive_new_post_from_followed_notifications ?? true,
        leetcodeUsername: profile.leetcode_username || null,
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
        avatar_url: 'https://images.pexels.com/photos/1716861/pexels-photo-1716861.jpeg?auto=compress&cs=tinysrgb&w=150',
        bio: 'New developer on InstaCode!',
        followers_count: 0,
        following_count: 0,
        posts_count: 0,
        receive_follow_notifications: true,
        receive_message_notifications: true,
        receive_post_like_notifications: true,
        receive_post_comment_notifications: true,
        receive_new_post_from_followed_notifications: true,
        leetcode_username: null,
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
        setUser(convertedUser);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Login failed. Please try again.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
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
          setUser(convertedUser);
          setIsAuthenticated(true);
        }

        return { success: true };
      }

      return { success: false, error: 'Signup failed. Please try again.' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;
    console.log('AuthContext: Initializing auth state');

    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Getting session from Supabase');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Session retrieved:', session ? 'exists' : 'null');
        
        if (mounted) {
          if (session?.user) {
            console.log('AuthContext: Converting user from session');
            const convertedUser = await convertSupabaseUser(session.user);
            console.log('AuthContext: User converted successfully');
            if (mounted) {
              setUser(convertedUser);
              setIsAuthenticated(true);
            }
          } else {
            console.log('AuthContext: No session found');
          }
          console.log('AuthContext: Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (mounted) {
          console.log('AuthContext: Setting loading to false due to error');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        console.log('AuthContext: Auth state changed:', event, session ? 'has session' : 'no session');
        
        if (!mounted) return;

        if (session?.user) {
          console.log('AuthContext: Converting user from auth state change');
          const convertedUser = await convertSupabaseUser(session.user);
          console.log('AuthContext: Auth state change conversion completed');
          if (mounted) {
            setUser(convertedUser);
            setIsAuthenticated(true);
          }
        } else {
          if (mounted) {
            console.log('AuthContext: Clearing user and authenticated from auth state change');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
        
        if (mounted) {
          console.log('AuthContext: Setting loading to false after auth state change');
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('AuthContext: Cleanup - unmounting');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log('AuthContext: Rendering with loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.username);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
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