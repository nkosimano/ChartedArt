import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAnalytics } from './useAnalytics';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  is_artist: boolean;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  artworks_count: number;
  created_at: string;
}

interface ArtistProfile extends UserProfile {
  artist_statement?: string;
  specialties: string[];
  years_active?: number;
  education?: string;
  exhibitions?: Exhibition[];
  awards?: Award[];
  commission_rate?: number;
  accepts_commissions: boolean;
}

interface Exhibition {
  id: string;
  title: string;
  venue: string;
  location: string;
  start_date: string;
  end_date?: string;
  type: 'solo' | 'group';
  description?: string;
}

interface Award {
  id: string;
  title: string;
  organization: string;
  year: number;
  description?: string;
}

interface Comment {
  id: string;
  product_id: string;
  user_id: string;
  content: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  likes_count: number;
  replies_count: number;
  user: {
    full_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  is_liked?: boolean;
  replies?: Comment[];
}

interface Like {
  id: string;
  user_id: string;
  target_type: 'product' | 'comment';
  target_id: string;
  created_at: string;
}

interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  cover_image_url?: string;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export function useSocialFeatures() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { trackUserEngagement } = useAnalytics();

  // Profile Management
  const getUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          followers:user_follows!following_id(count),
          following:user_follows!follower_id(count),
          artworks:products!artist_id(count)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        ...data,
        followers_count: data.followers[0]?.count || 0,
        following_count: data.following[0]?.count || 0,
        artworks_count: data.artworks[0]?.count || 0,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

      trackUserEngagement({
        action: 'profile_update',
        element: 'profile_form',
        value: 'profile_updated',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [trackUserEngagement]);

  // Artist Profile Management
  const getArtistProfile = useCallback(async (artistId: string): Promise<ArtistProfile | null> => {
    try {
      const [profileResponse, exhibitionsResponse, awardsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            *,
            followers:user_follows!following_id(count),
            following:user_follows!follower_id(count),
            artworks:products!artist_id(count)
          `)
          .eq('id', artistId)
          .eq('is_artist', true)
          .single(),
        supabase
          .from('artist_exhibitions')
          .select('*')
          .eq('artist_id', artistId)
          .order('start_date', { ascending: false }),
        supabase
          .from('artist_awards')
          .select('*')
          .eq('artist_id', artistId)
          .order('year', { ascending: false })
      ]);

      if (profileResponse.error) throw profileResponse.error;

      const profile = profileResponse.data;
      const exhibitions = exhibitionsResponse.data || [];
      const awards = awardsResponse.data || [];

      return {
        ...profile,
        followers_count: profile.followers[0]?.count || 0,
        following_count: profile.following[0]?.count || 0,
        artworks_count: profile.artworks[0]?.count || 0,
        exhibitions,
        awards,
      };
    } catch (error) {
      console.error('Error fetching artist profile:', error);
      return null;
    }
  }, []);

  // Following System
  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        throw new Error('Already following this user');
      }

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: session.user.id,
          following_id: userId,
        });

      if (error) throw error;

      // Create notification for the followed user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'new_follower',
          title: 'New Follower',
          message: `You have a new follower!`,
          data: {
            follower_id: session.user.id,
          },
        });

      trackUserEngagement({
        action: 'user_follow',
        element: 'follow_button',
        value: userId,
      });

      return true;
    } catch (error: any) {
      console.error('Error following user:', error);
      setError(error.message);
      return false;
    }
  }, [trackUserEngagement]);

  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId);

      if (error) throw error;

      trackUserEngagement({
        action: 'user_unfollow',
        element: 'unfollow_button',
        value: userId,
      });

      return true;
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      setError(error.message);
      return false;
    }
  }, [trackUserEngagement]);

  const isFollowing = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }, []);

  const getFollowers = useCallback(async (userId: string): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          profiles:follower_id (
            id,
            full_name,
            avatar_url,
            is_artist,
            is_verified
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(follow => follow.profiles).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }, []);

  const getFollowing = useCallback(async (userId: string): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          profiles:following_id (
            id,
            full_name,
            avatar_url,
            is_artist,
            is_verified
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(follow => follow.profiles).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }, []);

  // Comments System
  const getProductComments = useCallback(async (productId: string): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select(`
          *,
          user:profiles (
            full_name,
            avatar_url,
            is_verified
          ),
          likes:comment_likes(count),
          replies:product_comments!parent_comment_id(count)
        `)
        .eq('product_id', productId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user's likes
      const { data: { session } } = await supabase.auth.getSession();
      let userLikes: string[] = [];

      if (session) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', session.user.id)
          .in('comment_id', data?.map(c => c.id) || []);

        userLikes = likes?.map(l => l.comment_id) || [];
      }

      return (data || []).map(comment => ({
        ...comment,
        user: comment.user,
        likes_count: comment.likes[0]?.count || 0,
        replies_count: comment.replies[0]?.count || 0,
        is_liked: userLikes.includes(comment.id),
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }, []);

  const addComment = useCallback(async (
    productId: string,
    content: string,
    rating?: number,
    parentCommentId?: string
  ): Promise<Comment | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('product_comments')
        .insert({
          product_id: productId,
          user_id: session.user.id,
          content,
          rating,
          parent_comment_id: parentCommentId,
        })
        .select(`
          *,
          user:profiles (
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      // If it's a top-level comment, notify the artist
      if (!parentCommentId) {
        const { data: product } = await supabase
          .from('products')
          .select('artist_id, name')
          .eq('id', productId)
          .single();

        if (product && product.artist_id !== session.user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: product.artist_id,
              type: 'new_comment',
              title: 'New Comment',
              message: `Someone commented on your artwork "${product.name}"`,
              data: {
                product_id: productId,
                comment_id: data.id,
                commenter_id: session.user.id,
              },
            });
        }
      }

      trackUserEngagement({
        action: 'comment_add',
        element: 'comment_form',
        value: productId,
      });

      return {
        ...data,
        user: data.user,
        likes_count: 0,
        replies_count: 0,
        is_liked: false,
      };
    } catch (error: any) {
      console.error('Error adding comment:', error);
      setError(error.message);
      return null;
    }
  }, [trackUserEngagement]);

  const likeComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('comment_id', commentId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;

        trackUserEngagement({
          action: 'comment_unlike',
          element: 'like_button',
          value: commentId,
        });
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            user_id: session.user.id,
            comment_id: commentId,
          });

        if (error) throw error;

        trackUserEngagement({
          action: 'comment_like',
          element: 'like_button',
          value: commentId,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Error toggling comment like:', error);
      setError(error.message);
      return false;
    }
  }, [trackUserEngagement]);

  // Collections System
  const getUserCollections = useCallback(async (userId: string, includePrivate: boolean = false): Promise<Collection[]> => {
    try {
      let query = supabase
        .from('user_collections')
        .select(`
          *,
          products:collection_products(count)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!includePrivate) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(collection => ({
        ...collection,
        products_count: collection.products[0]?.count || 0,
      }));
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }, []);

  const createCollection = useCallback(async (
    name: string,
    description?: string,
    isPublic: boolean = true
  ): Promise<Collection | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: session.user.id,
          name,
          description,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) throw error;

      trackUserEngagement({
        action: 'collection_create',
        element: 'collection_form',
        value: name,
      });

      return {
        ...data,
        products_count: 0,
      };
    } catch (error: any) {
      console.error('Error creating collection:', error);
      setError(error.message);
      return null;
    }
  }, [trackUserEngagement]);

  const addToCollection = useCallback(async (collectionId: string, productId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check if product is already in collection
      const { data: existing } = await supabase
        .from('collection_products')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        throw new Error('Product already in collection');
      }

      const { error } = await supabase
        .from('collection_products')
        .insert({
          collection_id: collectionId,
          product_id: productId,
        });

      if (error) throw error;

      // Update collection timestamp
      await supabase
        .from('user_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

      trackUserEngagement({
        action: 'collection_add_product',
        element: 'collection_button',
        value: productId,
      });

      return true;
    } catch (error: any) {
      console.error('Error adding to collection:', error);
      setError(error.message);
      return false;
    }
  }, [trackUserEngagement]);

  // Product Likes
  const likeProduct = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('product_likes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('product_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;

        trackUserEngagement({
          action: 'product_unlike',
          element: 'like_button',
          value: productId,
        });
      } else {
        // Like
        const { error } = await supabase
          .from('product_likes')
          .insert({
            user_id: session.user.id,
            product_id: productId,
          });

        if (error) throw error;

        trackUserEngagement({
          action: 'product_like',
          element: 'like_button',
          value: productId,
        });
      }

      return true;
    } catch (error: any) {
      console.error('Error toggling product like:', error);
      setError(error.message);
      return false;
    }
  }, [trackUserEngagement]);

  const isProductLiked = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase
        .from('product_likes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }, []);

  // Social Feed
  const getSocialFeed = useCallback(async (limit: number = 20, offset: number = 0) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Get activities from followed users and own activities
      const { data, error } = await supabase
        .from('user_activities')
        .select(`
          *,
          user:profiles!user_id (
            full_name,
            avatar_url,
            is_verified
          ),
          product:products (
            id,
            name,
            image_url,
            price,
            currency
          )
        `)
        .in('user_id', [
          session.user.id,
          // This would need a subquery for followed users
        ])
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching social feed:', error);
      return [];
    }
  }, []);

  return {
    // State
    loading,
    error,

    // Profile Management
    getUserProfile,
    updateUserProfile,
    getArtistProfile,

    // Following System
    followUser,
    unfollowUser,
    isFollowing,
    getFollowers,
    getFollowing,

    // Comments System
    getProductComments,
    addComment,
    likeComment,

    // Collections
    getUserCollections,
    createCollection,
    addToCollection,

    // Product Interactions
    likeProduct,
    isProductLiked,

    // Social Feed
    getSocialFeed,
  };
}