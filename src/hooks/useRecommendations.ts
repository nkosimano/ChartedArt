import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAnalytics } from './useAnalytics';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  style: string;
  medium: string;
  dominant_colors: string[];
  image_url: string;
  artist_id: string;
  artist_name: string;
  tags: string[];
  created_at: string;
}

interface Recommendation {
  product: Product;
  score: number;
  reason: string;
  recommendation_type: 'collaborative' | 'content' | 'trending' | 'similar' | 'personalized';
}

interface UserPreferences {
  preferred_categories: string[];
  preferred_styles: string[];
  preferred_price_range: { min: number; max: number };
  preferred_mediums: string[];
  preferred_colors: string[];
  followed_artists: string[];
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { trackUserEngagement } = useAnalytics();

  // Load user preferences from browsing history and purchases
  const loadUserPreferences = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      // Get user browsing history
      const { data: browsingHistory } = await supabase
        .from('user_browsing_history')
        .select(`
          product_id,
          time_spent_seconds,
          products (
            category,
            style,
            medium,
            price,
            dominant_colors,
            artist_id,
            tags
          )
        `)
        .eq('user_id', session.user.id)
        .order('viewed_at', { ascending: false })
        .limit(100);

      // Get purchase history
      const { data: purchaseHistory } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          orders!inner (
            user_id,
            status
          ),
          products (
            category,
            style,
            medium,
            dominant_colors,
            artist_id,
            tags
          )
        `)
        .eq('orders.user_id', session.user.id)
        .eq('orders.status', 'paid');

      // Get followed artists
      const { data: followedArtists } = await supabase
        .from('user_artist_follows')
        .select('artist_id')
        .eq('user_id', session.user.id);

      // Analyze preferences
      const preferences = analyzeUserPreferences(browsingHistory || [], purchaseHistory || []);
      preferences.followed_artists = followedArtists?.map(f => f.artist_id) || [];

      setUserPreferences(preferences);
      return preferences;

    } catch (error) {
      console.error('Error loading user preferences:', error);
      return null;
    }
  }, []);

  // Analyze user behavior to extract preferences
  const analyzeUserPreferences = (browsingHistory: any[], purchaseHistory: any[]): UserPreferences => {
    const categoryCount: Record<string, number> = {};
    const styleCount: Record<string, number> = {};
    const mediumCount: Record<string, number> = {};
    const colorCount: Record<string, number> = {};
    const pricePoints: number[] = [];

    // Weight purchase history more heavily than browsing
    const processItem = (item: any, weight: number = 1) => {
      if (!item.products) return;

      const product = item.products;
      
      // Categories
      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + weight;
      }

      // Styles
      if (product.style) {
        styleCount[product.style] = (styleCount[product.style] || 0) + weight;
      }

      // Mediums
      if (product.medium) {
        mediumCount[product.medium] = (mediumCount[product.medium] || 0) + weight;
      }

      // Colors
      if (product.dominant_colors && Array.isArray(product.dominant_colors)) {
        product.dominant_colors.forEach((color: string) => {
          colorCount[color] = (colorCount[color] || 0) + weight;
        });
      }

      // Prices
      if (product.price) {
        pricePoints.push(product.price);
      }
    };

    // Process browsing history (weight by time spent)
    browsingHistory.forEach(item => {
      const timeWeight = Math.min(item.time_spent_seconds / 30, 3); // Max weight of 3
      processItem(item, Math.max(timeWeight, 0.5));
    });

    // Process purchase history (higher weight)
    purchaseHistory.forEach(item => {
      const quantityWeight = item.quantity || 1;
      processItem(item, quantityWeight * 5); // 5x weight for purchases
    });

    // Extract top preferences
    const getTopItems = (counts: Record<string, number>, limit: number = 5) => {
      return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([item]) => item);
    };

    // Calculate price range preference
    let priceRange = { min: 0, max: 10000 };
    if (pricePoints.length > 0) {
      pricePoints.sort((a, b) => a - b);
      const q25 = pricePoints[Math.floor(pricePoints.length * 0.25)];
      const q75 = pricePoints[Math.floor(pricePoints.length * 0.75)];
      priceRange = {
        min: Math.max(0, q25 - (q75 - q25) * 0.5),
        max: q75 + (q75 - q25) * 0.5
      };
    }

    return {
      preferred_categories: getTopItems(categoryCount),
      preferred_styles: getTopItems(styleCount),
      preferred_mediums: getTopItems(mediumCount),
      preferred_colors: getTopItems(colorCount, 8),
      preferred_price_range: priceRange,
      followed_artists: [], // Will be filled by caller
    };
  };

  // Get personalized recommendations
  const getPersonalizedRecommendations = useCallback(async (limit: number = 20): Promise<Recommendation[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return getTrendingRecommendations(limit);
      }

      const preferences = await loadUserPreferences();
      if (!preferences) {
        return getTrendingRecommendations(limit);
      }

      const recommendations: Recommendation[] = [];

      // 1. Collaborative Filtering (40% weight)
      const collaborative = await getCollaborativeRecommendations(session.user.id, Math.ceil(limit * 0.4));
      recommendations.push(...collaborative);

      // 2. Content-Based Filtering (30% weight)
      const contentBased = await getContentBasedRecommendations(preferences, Math.ceil(limit * 0.3));
      recommendations.push(...contentBased);

      // 3. Trending/Popular (20% weight)
      const trending = await getTrendingRecommendations(Math.ceil(limit * 0.2));
      recommendations.push(...trending);

      // 4. Similar to Recent Views (10% weight)
      const similar = await getSimilarToRecentViews(session.user.id, Math.ceil(limit * 0.1));
      recommendations.push(...similar);

      // Remove duplicates and sort by score
      const uniqueRecommendations = Array.from(
        new Map(recommendations.map(rec => [rec.product.id, rec])).values()
      ).sort((a, b) => b.score - a.score);

      // Apply diversity filter to avoid too similar recommendations
      const diverseRecommendations = applyDiversityFilter(uniqueRecommendations, limit);

      setRecommendations(diverseRecommendations);
      return diverseRecommendations;

    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      setError('Failed to load recommendations');
      const fallback = await getTrendingRecommendations(limit);
      setRecommendations(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [loadUserPreferences]);

  // Collaborative filtering based on similar users
  const getCollaborativeRecommendations = async (userId: string, limit: number): Promise<Recommendation[]> => {
    try {
      // Find users with similar purchase patterns
      const { data: similarUsers } = await supabase.rpc('find_similar_users', {
        target_user_id: userId,
        limit_users: 50
      });

      if (!similarUsers || similarUsers.length === 0) {
        return [];
      }

      // Get products liked by similar users but not viewed by current user
      const { data: recommendations } = await supabase.rpc('get_collaborative_recommendations', {
        target_user_id: userId,
        similar_user_ids: similarUsers.map((u: any) => u.user_id),
        limit_products: limit
      });

      return (recommendations || []).map((rec: any) => ({
        product: rec,
        score: rec.recommendation_score || 0.7,
        reason: `Users with similar taste also liked this`,
        recommendation_type: 'collaborative' as const,
      }));

    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  };

  // Content-based filtering using user preferences
  const getContentBasedRecommendations = async (preferences: UserPreferences, limit: number): Promise<Recommendation[]> => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles:artist_id (
            full_name
          )
        `)
        .eq('status', 'active')
        .gt('stock_quantity', 0);

      // Filter by preferences
      if (preferences.preferred_categories.length > 0) {
        query = query.in('category', preferences.preferred_categories);
      }

      if (preferences.preferred_styles.length > 0) {
        query = query.in('style', preferences.preferred_styles);
      }

      if (preferences.preferred_mediums.length > 0) {
        query = query.in('medium', preferences.preferred_mediums);
      }

      if (preferences.preferred_price_range) {
        query = query
          .gte('price', preferences.preferred_price_range.min)
          .lte('price', preferences.preferred_price_range.max);
      }

      if (preferences.followed_artists.length > 0) {
        query = query.in('artist_id', preferences.followed_artists);
      }

      const { data: products } = await query
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more to allow for scoring

      if (!products) return [];

      // Score products based on preference alignment
      const scoredProducts = products.map(product => {
        let score = 0.5; // Base score

        // Category match
        if (preferences.preferred_categories.includes(product.category)) {
          score += 0.2;
        }

        // Style match
        if (preferences.preferred_styles.includes(product.style)) {
          score += 0.15;
        }

        // Medium match
        if (preferences.preferred_mediums.includes(product.medium)) {
          score += 0.1;
        }

        // Color match
        if (product.dominant_colors && Array.isArray(product.dominant_colors)) {
          const colorMatches = product.dominant_colors.filter(color => 
            preferences.preferred_colors.includes(color)
          ).length;
          score += (colorMatches / Math.max(product.dominant_colors.length, 1)) * 0.1;
        }

        // Followed artist bonus
        if (preferences.followed_artists.includes(product.artist_id)) {
          score += 0.3;
        }

        // Price preference alignment
        const priceRange = preferences.preferred_price_range;
        if (product.price >= priceRange.min && product.price <= priceRange.max) {
          score += 0.05;
        }

        return {
          product: {
            ...product,
            artist_name: product.profiles?.full_name || 'Unknown Artist',
          },
          score,
          reason: getContentBasedReason(product, preferences),
          recommendation_type: 'content' as const,
        };
      });

      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error in content-based filtering:', error);
      return [];
    }
  };

  const getContentBasedReason = (product: any, preferences: UserPreferences): string => {
    const reasons = [];

    if (preferences.preferred_categories.includes(product.category)) {
      reasons.push(`${product.category} artwork`);
    }

    if (preferences.preferred_styles.includes(product.style)) {
      reasons.push(`${product.style} style`);
    }

    if (preferences.followed_artists.includes(product.artist_id)) {
      reasons.push('from an artist you follow');
    }

    if (reasons.length === 0) {
      return 'Matches your preferences';
    }

    return `Based on your interest in ${reasons.join(', ')}`;
  };

  // Get trending/popular recommendations
  const getTrendingRecommendations = async (limit: number): Promise<Recommendation[]> => {
    try {
      const { data: trendingProducts } = await supabase.rpc('get_trending_products', {
        limit_products: limit,
        days_back: 30
      });

      return (trendingProducts || []).map((product: any) => ({
        product,
        score: 0.6,
        reason: 'Trending now',
        recommendation_type: 'trending' as const,
      }));

    } catch (error) {
      console.error('Error getting trending recommendations:', error);
      // Fallback to recent products
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          profiles:artist_id (
            full_name
          )
        `)
        .eq('status', 'active')
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      return (products || []).map(product => ({
        product: {
          ...product,
          artist_name: product.profiles?.full_name || 'Unknown Artist',
        },
        score: 0.5,
        reason: 'Recently added',
        recommendation_type: 'trending' as const,
      }));
    }
  };

  // Get recommendations similar to recently viewed items
  const getSimilarToRecentViews = async (userId: string, limit: number): Promise<Recommendation[]> => {
    try {
      const { data: recentViews } = await supabase
        .from('user_browsing_history')
        .select('product_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentViews || recentViews.length === 0) {
        return [];
      }

      const productIds = recentViews.map(v => v.product_id);

      const { data: similarProducts } = await supabase.rpc('find_similar_products', {
        product_ids: productIds,
        limit_products: limit
      });

      return (similarProducts || []).map((product: any) => ({
        product,
        score: 0.65,
        reason: 'Similar to items you viewed',
        recommendation_type: 'similar' as const,
      }));

    } catch (error) {
      console.error('Error getting similar recommendations:', error);
      return [];
    }
  };

  // Apply diversity filter to avoid too many similar recommendations
  const applyDiversityFilter = (recommendations: Recommendation[], limit: number): Recommendation[] => {
    const diverse: Recommendation[] = [];
    const categoryCount: Record<string, number> = {};
    const artistCount: Record<string, number> = {};

    for (const rec of recommendations) {
      if (diverse.length >= limit) break;

      const category = rec.product.category;
      const artistId = rec.product.artist_id;

      const categoryLimit = Math.max(2, Math.floor(limit / 4)); // Max 25% from same category
      const artistLimit = Math.max(1, Math.floor(limit / 8)); // Max 12.5% from same artist

      if ((categoryCount[category] || 0) < categoryLimit && 
          (artistCount[artistId] || 0) < artistLimit) {
        diverse.push(rec);
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        artistCount[artistId] = (artistCount[artistId] || 0) + 1;
      }
    }

    // Fill remaining slots if needed
    for (const rec of recommendations) {
      if (diverse.length >= limit) break;
      if (!diverse.find(d => d.product.id === rec.product.id)) {
        diverse.push(rec);
      }
    }

    return diverse.slice(0, limit);
  };

  // Track recommendation interaction
  const trackRecommendationClick = useCallback((recommendation: Recommendation, position: number) => {
    trackUserEngagement({
      action: 'recommendation_click',
      element: 'recommendation_card',
      value: JSON.stringify({
        product_id: recommendation.product.id,
        recommendation_type: recommendation.recommendation_type,
        position,
        score: recommendation.score,
      }),
    });
  }, [trackUserEngagement]);

  return {
    recommendations,
    userPreferences,
    loading,
    error,
    getPersonalizedRecommendations,
    loadUserPreferences,
    trackRecommendationClick,
  };
}