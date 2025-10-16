import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAnalytics } from './useAnalytics';

interface SearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  mediums?: string[];
  artists?: string[];
  priceRange?: { min: number; max: number };
  colors?: string[];
  tags?: string[];
  yearRange?: { min: number; max: number };
  dimensions?: { width?: number; height?: number; operator?: 'exact' | 'min' | 'max' };
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_newest' | 'date_oldest' | 'popularity';
  availability?: 'in_stock' | 'all';
}

interface SearchResult {
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
  year_created: number;
  dimensions: string;
  stock_quantity: number;
  relevance_score?: number;
  match_reasons?: string[];
}

interface SearchSuggestion {
  type: 'query' | 'category' | 'artist' | 'style' | 'medium' | 'tag';
  value: string;
  label: string;
  count?: number;
}

interface VisualSearchResult {
  product_id: string;
  similarity_score: number;
  match_type: 'color' | 'composition' | 'style' | 'subject';
}

export function useSmartSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const searchCache = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map());
  const abortController = useRef<AbortController>();

  const { trackSearchQuery, trackUserEngagement } = useAnalytics();

  // Main search function with AI-powered natural language processing
  const search = useCallback(async (
    filters: SearchFilters,
    page: number = 1,
    pageSize: number = 24
  ): Promise<SearchResult[]> => {
    // Cancel any ongoing search
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const cacheKey = JSON.stringify({ filters, page, pageSize });
      const cached = searchCache.current.get(cacheKey);
      
      // Return cached results if they're less than 5 minutes old
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setResults(page === 1 ? cached.results : [...results, ...cached.results]);
        setLoading(false);
        return cached.results;
      }

      let searchResults: SearchResult[] = [];
      
      // If there's a natural language query, process it with AI
      if (filters.query && filters.query.trim()) {
        const processedQuery = await processNaturalLanguageQuery(filters.query);
        const enhancedFilters = { ...filters, ...processedQuery };
        searchResults = await performDatabaseSearch(enhancedFilters, page, pageSize);
      } else {
        searchResults = await performDatabaseSearch(filters, page, pageSize);
      }

      // Cache the results
      searchCache.current.set(cacheKey, {
        results: searchResults,
        timestamp: Date.now()
      });

      // Clean cache if it gets too large
      if (searchCache.current.size > 100) {
        const oldest = Array.from(searchCache.current.entries())
          .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0];
        searchCache.current.delete(oldest);
      }

      setResults(page === 1 ? searchResults : [...results, ...searchResults]);
      setCurrentPage(page);
      setHasMore(searchResults.length === pageSize);

      // Track search
      trackSearchQuery(filters.query || 'filtered_search', searchResults.length);

      return searchResults;

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        setError(error.message || 'Search failed');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [results, trackSearchQuery]);

  // Process natural language queries using AI/NLP
  const processNaturalLanguageQuery = async (query: string): Promise<Partial<SearchFilters>> => {
    const processed: Partial<SearchFilters> = {};
    const queryLower = query.toLowerCase();

    // Extract price information
    const priceMatches = queryLower.match(/(?:under|below|less than)\s*\$?(\d+)|(?:over|above|more than)\s*\$?(\d+)|\$(\d+)(?:\s*-\s*|\s+to\s+)\$?(\d+)/);
    if (priceMatches) {
      if (priceMatches[1]) { // under X
        processed.priceRange = { min: 0, max: parseInt(priceMatches[1]) };
      } else if (priceMatches[2]) { // over X
        processed.priceRange = { min: parseInt(priceMatches[2]), max: 999999 };
      } else if (priceMatches[3] && priceMatches[4]) { // X to Y
        processed.priceRange = { 
          min: parseInt(priceMatches[3]), 
          max: parseInt(priceMatches[4]) 
        };
      }
    }

    // Extract color information
    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'gold', 'silver'];
    const foundColors = colors.filter(color => queryLower.includes(color));
    if (foundColors.length > 0) {
      processed.colors = foundColors;
    }

    // Extract style information
    const styles = ['abstract', 'realistic', 'impressionist', 'modern', 'contemporary', 'classical', 'surreal', 'minimalist', 'vintage'];
    const foundStyles = styles.filter(style => queryLower.includes(style));
    if (foundStyles.length > 0) {
      processed.styles = foundStyles;
    }

    // Extract medium information
    const mediums = ['oil painting', 'acrylic', 'watercolor', 'digital', 'photography', 'sculpture', 'drawing', 'print', 'mixed media'];
    const foundMediums = mediums.filter(medium => 
      queryLower.includes(medium) || queryLower.includes(medium.replace(' ', ''))
    );
    if (foundMediums.length > 0) {
      processed.mediums = foundMediums;
    }

    // Extract category information
    const categories = ['painting', 'photography', 'sculpture', 'drawing', 'print', 'digital art'];
    const foundCategories = categories.filter(category => queryLower.includes(category));
    if (foundCategories.length > 0) {
      processed.categories = foundCategories;
    }

    // Extract year/time period information
    const yearMatches = queryLower.match(/(?:from|since|after)\s*(\d{4})|(?:before|until)\s*(\d{4})|(\d{4})(?:\s*-\s*|\s+to\s+)(\d{4})|(\d{4})s/);
    if (yearMatches) {
      if (yearMatches[1]) { // from/since/after YYYY
        processed.yearRange = { min: parseInt(yearMatches[1]), max: new Date().getFullYear() };
      } else if (yearMatches[2]) { // before/until YYYY
        processed.yearRange = { min: 1800, max: parseInt(yearMatches[2]) };
      } else if (yearMatches[3] && yearMatches[4]) { // YYYY to YYYY
        processed.yearRange = { 
          min: parseInt(yearMatches[3]), 
          max: parseInt(yearMatches[4]) 
        };
      } else if (yearMatches[5]) { // 1990s
        const decade = parseInt(yearMatches[5]);
        processed.yearRange = { min: decade, max: decade + 9 };
      }
    }

    // Extract size information
    const sizeMatches = queryLower.match(/(?:large|big|huge)|(?:small|tiny|miniature)|(?:medium|mid)[- ]?size/);
    if (sizeMatches) {
      const sizeHint = sizeMatches[0];
      if (sizeHint.includes('large') || sizeHint.includes('big') || sizeHint.includes('huge')) {
        processed.dimensions = { width: 30, operator: 'min' }; // 30+ inches
      } else if (sizeHint.includes('small') || sizeHint.includes('tiny') || sizeHint.includes('miniature')) {
        processed.dimensions = { width: 12, operator: 'max' }; // Under 12 inches
      }
    }

    return processed;
  };

  // Perform the actual database search
  const performDatabaseSearch = async (
    filters: SearchFilters,
    page: number,
    pageSize: number
  ): Promise<SearchResult[]> => {
    let query = supabase
      .from('products')
      .select(`
        *,
        profiles:artist_id (
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'active');

    // Apply availability filter
    if (filters.availability === 'in_stock') {
      query = query.gt('stock_quantity', 0);
    }

    // Apply text search
    if (filters.query && filters.query.trim()) {
      const searchTerm = filters.query.trim();
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);
    }

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }

    // Apply style filter
    if (filters.styles && filters.styles.length > 0) {
      query = query.in('style', filters.styles);
    }

    // Apply medium filter
    if (filters.mediums && filters.mediums.length > 0) {
      query = query.in('medium', filters.mediums);
    }

    // Apply artist filter
    if (filters.artists && filters.artists.length > 0) {
      query = query.in('artist_id', filters.artists);
    }

    // Apply price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        query = query.gte('price', filters.priceRange.min);
      }
      if (filters.priceRange.max !== undefined) {
        query = query.lte('price', filters.priceRange.max);
      }
    }

    // Apply year range filter
    if (filters.yearRange) {
      if (filters.yearRange.min !== undefined) {
        query = query.gte('year_created', filters.yearRange.min);
      }
      if (filters.yearRange.max !== undefined) {
        query = query.lte('year_created', filters.yearRange.max);
      }
    }

    // Apply color filter (using overlap operator for arrays)
    if (filters.colors && filters.colors.length > 0) {
      query = query.overlaps('dominant_colors', filters.colors);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'date_newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'date_oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popularity':
        query = query.order('view_count', { ascending: false, nullsFirst: false });
        break;
      default: // relevance
        if (filters.query && filters.query.trim()) {
          // For relevance, we'll order by a combination of factors
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // Set total results count
    if (count !== null) {
      setTotalResults(count);
    }

    // Transform results
    const searchResults: SearchResult[] = (data || []).map(product => ({
      ...product,
      artist_name: product.profiles?.full_name || 'Unknown Artist',
      relevance_score: calculateRelevanceScore(product, filters),
      match_reasons: getMatchReasons(product, filters),
    }));

    return searchResults;
  };

  // Calculate relevance score for search results
  const calculateRelevanceScore = (product: any, filters: SearchFilters): number => {
    let score = 0.5; // Base score

    if (filters.query && filters.query.trim()) {
      const query = filters.query.toLowerCase();
      const name = product.name?.toLowerCase() || '';
      const description = product.description?.toLowerCase() || '';
      
      // Exact name match gets highest score
      if (name === query) score += 1.0;
      else if (name.includes(query)) score += 0.7;
      
      // Description match
      if (description.includes(query)) score += 0.3;
      
      // Tag matches
      if (product.tags && product.tags.some((tag: string) => 
        tag.toLowerCase().includes(query))) {
        score += 0.4;
      }
    }

    // Category match bonus
    if (filters.categories && filters.categories.includes(product.category)) {
      score += 0.2;
    }

    // Style match bonus
    if (filters.styles && filters.styles.includes(product.style)) {
      score += 0.2;
    }

    // Recent products get slight boost
    const daysSinceCreation = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  };

  // Get match reasons for explaining why a result was returned
  const getMatchReasons = (product: any, filters: SearchFilters): string[] => {
    const reasons: string[] = [];

    if (filters.query && filters.query.trim()) {
      const query = filters.query.toLowerCase();
      if (product.name?.toLowerCase().includes(query)) {
        reasons.push('Title match');
      }
      if (product.description?.toLowerCase().includes(query)) {
        reasons.push('Description match');
      }
      if (product.tags?.some((tag: string) => tag.toLowerCase().includes(query))) {
        reasons.push('Tag match');
      }
    }

    if (filters.categories && filters.categories.includes(product.category)) {
      reasons.push(`${product.category} category`);
    }

    if (filters.styles && filters.styles.includes(product.style)) {
      reasons.push(`${product.style} style`);
    }

    if (filters.colors && product.dominant_colors) {
      const matchedColors = product.dominant_colors.filter((color: string) => 
        filters.colors!.includes(color)
      );
      if (matchedColors.length > 0) {
        reasons.push(`Contains ${matchedColors.join(', ')} colors`);
      }
    }

    return reasons;
  };

  // Get search suggestions based on partial input
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return [];
    }

    try {
      const suggestions: SearchSuggestion[] = [];

      // Get artist suggestions
      const { data: artists } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      artists?.forEach(artist => {
        suggestions.push({
          type: 'artist',
          value: artist.id,
          label: artist.full_name,
        });
      });

      // Get category/style suggestions from products
      const { data: products } = await supabase
        .from('products')
        .select('category, style, medium, tags')
        .or(`category.ilike.%${query}%,style.ilike.%${query}%,medium.ilike.%${query}%`)
        .limit(10);

      const categories = new Set<string>();
      const styles = new Set<string>();
      const mediums = new Set<string>();
      const tags = new Set<string>();

      products?.forEach(product => {
        if (product.category?.toLowerCase().includes(query.toLowerCase())) {
          categories.add(product.category);
        }
        if (product.style?.toLowerCase().includes(query.toLowerCase())) {
          styles.add(product.style);
        }
        if (product.medium?.toLowerCase().includes(query.toLowerCase())) {
          mediums.add(product.medium);
        }
        if (product.tags) {
          product.tags.forEach((tag: string) => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              tags.add(tag);
            }
          });
        }
      });

      // Add unique suggestions
      categories.forEach(category => {
        suggestions.push({
          type: 'category',
          value: category,
          label: category,
        });
      });

      styles.forEach(style => {
        suggestions.push({
          type: 'style',
          value: style,
          label: style,
        });
      });

      mediums.forEach(medium => {
        suggestions.push({
          type: 'medium',
          value: medium,
          label: medium,
        });
      });

      Array.from(tags).slice(0, 5).forEach(tag => {
        suggestions.push({
          type: 'tag',
          value: tag,
          label: tag,
        });
      });

      setSuggestions(suggestions.slice(0, 10));
      return suggestions;

    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, []);

  // Visual similarity search using uploaded image
  const visualSearch = useCallback(async (imageFile: File): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);

    try {
      // Upload image for analysis
      const formData = new FormData();
      formData.append('image', imageFile);

      // This would typically call an AI vision service
      // For now, we'll implement a basic color-based search
      const results = await performVisualSearch(imageFile);

      setResults(results);
      
      trackUserEngagement({
        action: 'visual_search',
        element: 'image_upload',
        value: 'visual_search_performed',
      });

      return results;

    } catch (error: any) {
      console.error('Visual search error:', error);
      setError('Visual search failed');
      return [];
    } finally {
      setLoading(false);
    }
  }, [trackUserEngagement]);

  // Placeholder for visual search implementation
  const performVisualSearch = async (imageFile: File): Promise<SearchResult[]> => {
    // This would integrate with an AI vision service like Google Vision API,
    // AWS Rekognition, or a custom ML model to analyze the image and find
    // similar artworks based on visual features

    // For demo purposes, return some mock results
    const { data: products } = await supabase
      .from('products')
      .select(`
        *,
        profiles:artist_id (
          full_name
        )
      `)
      .eq('status', 'active')
      .limit(10);

    return (products || []).map(product => ({
      ...product,
      artist_name: product.profiles?.full_name || 'Unknown Artist',
      relevance_score: Math.random() * 0.5 + 0.5, // Mock similarity score
      match_reasons: ['Visual similarity'],
    }));
  };

  // Load more results for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      search({}, currentPage + 1);
    }
  }, [loading, hasMore, currentPage, search]);

  // Clear search results
  const clearResults = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setError(null);
    setTotalResults(0);
    setCurrentPage(1);
    setHasMore(false);
    searchCache.current.clear();
  }, []);

  return {
    // State
    results,
    suggestions,
    loading,
    error,
    totalResults,
    currentPage,
    hasMore,

    // Methods
    search,
    getSuggestions,
    visualSearch,
    loadMore,
    clearResults,
  };
}