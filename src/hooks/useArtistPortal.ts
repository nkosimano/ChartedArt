import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { trackUserEngagement } from '../lib/analytics';

// Types for Artist Portal
interface ArtistPortfolio {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  medium?: string;
  dimensions?: string;
  year_created?: number;
  is_featured: boolean;
  is_available_for_commission: boolean;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CommissionRequest {
  id: string;
  customer_id: string;
  artist_id: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  preferred_medium?: string;
  preferred_style?: string;
  dimensions?: string;
  deadline?: string;
  reference_images: string[];
  status: 'pending' | 'reviewing' | 'quote_sent' | 'accepted' | 'in_progress' | 'completed' | 'delivered' | 'cancelled' | 'rejected';
  artist_notes?: string;
  quote_amount?: number;
  quote_details?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface CommissionMessage {
  id: string;
  commission_id: string;
  sender_id: string;
  message: string;
  attachments: string[];
  is_status_update: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ArtistEarnings {
  period_start: string;
  period_end: string;
  commission_rate: number;
  total_orders: number;
  total_units_sold: number;
  gross_revenue: number;
  commission_earnings: number;
  avg_order_value: number;
  unique_customers: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  image_url?: string;
  price: number;
  total_sales: number;
  total_revenue: number;
  current_stock: number;
  status: string;
}

interface CommissionMetrics {
  total_requests: number;
  pending_requests: number;
  active_commissions: number;
  completed_commissions: number;
  declined_requests: number;
  avg_commission_value: number;
  total_commission_earnings: number;
}

interface ArtistPayout {
  id: string;
  artist_id: string;
  amount: number;
  currency: string;
  status: 'requested' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payout_method?: string;
  transaction_id?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MonthlyEarnings {
  id: string;
  artist_id: string;
  year: number;
  month: number;
  gross_revenue: number;
  commission_earnings: number;
  total_orders: number;
  total_units_sold: number;
  avg_order_value: number;
  best_selling_product_id?: string;
  created_at: string;
  updated_at: string;
}

interface InventoryLog {
  id: string;
  product_id: string;
  artist_id: string;
  action: 'stock_added' | 'stock_removed' | 'sale' | 'return' | 'adjustment';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  created_at: string;
  product?: {
    name: string;
    image_url?: string;
  };
}

interface UseArtistPortalReturn {
  // Portfolio Management
  portfolios: ArtistPortfolio[];
  portfoliosLoading: boolean;
  portfoliosError: string | null;
  addPortfolioItem: (portfolio: Omit<ArtistPortfolio, 'id' | 'artist_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updatePortfolioItem: (id: string, updates: Partial<ArtistPortfolio>) => Promise<boolean>;
  deletePortfolioItem: (id: string) => Promise<boolean>;
  
  // Commission Management
  commissionRequests: CommissionRequest[];
  commissionMessages: { [commissionId: string]: CommissionMessage[] };
  commissionsLoading: boolean;
  commissionsError: string | null;
  updateCommissionStatus: (id: string, status: CommissionRequest['status'], notes?: string) => Promise<boolean>;
  sendQuote: (id: string, amount: number, details: string, estimatedCompletion?: string) => Promise<boolean>;
  sendCommissionMessage: (commissionId: string, message: string, attachments?: string[]) => Promise<boolean>;
  
  // Sales Analytics
  earnings: ArtistEarnings | null;
  topProducts: TopProduct[];
  commissionMetrics: CommissionMetrics | null;
  monthlyEarnings: MonthlyEarnings[];
  analyticsLoading: boolean;
  analyticsError: string | null;
  fetchEarnings: (startDate?: string, endDate?: string) => Promise<void>;
  
  // Payout Management
  payouts: ArtistPayout[];
  payoutsLoading: boolean;
  payoutsError: string | null;
  requestPayout: (amount: number, method: string, details: any) => Promise<boolean>;
  
  // Inventory Management
  inventoryLogs: InventoryLog[];
  inventoryLoading: boolean;
  inventoryError: string | null;
  updateProductStock: (productId: string, newStock: number, reason?: string) => Promise<boolean>;
  
  // Profile Management for Artists
  updateArtistProfile: (updates: any) => Promise<boolean>;
  
  // Loading States
  loading: boolean;
  error: string | null;
  
  // Utility Functions
  refreshData: () => Promise<void>;
}

export const useArtistPortal = (): UseArtistPortalReturn => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Portfolio State
  const [portfolios, setPortfolios] = useState<ArtistPortfolio[]>([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [portfoliosError, setPortfoliosError] = useState<string | null>(null);
  
  // Commission State
  const [commissionRequests, setCommissionRequests] = useState<CommissionRequest[]>([]);
  const [commissionMessages, setCommissionMessages] = useState<{ [commissionId: string]: CommissionMessage[] }>({});
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionsError, setCommissionsError] = useState<string | null>(null);
  
  // Analytics State
  const [earnings, setEarnings] = useState<ArtistEarnings | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [commissionMetrics, setCommissionMetrics] = useState<CommissionMetrics | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  
  // Payout State
  const [payouts, setPayouts] = useState<ArtistPayout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  
  // Inventory State
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Check if user is an artist
  const isArtist = profile?.is_artist === true;

  // Fetch Portfolio Items
  const fetchPortfolios = useCallback(async () => {
    if (!user || !isArtist) return;
    
    setPortfoliosLoading(true);
    setPortfoliosError(null);
    
    try {
      const { data, error } = await supabase
        .from('artist_portfolios')
        .select('*')
        .eq('artist_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPortfolios(data || []);
      
      trackUserEngagement(user.id, 'portfolio_viewed');
    } catch (err) {
      setPortfoliosError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
    } finally {
      setPortfoliosLoading(false);
    }
  }, [user, isArtist]);

  // Add Portfolio Item
  const addPortfolioItem = useCallback(async (
    portfolio: Omit<ArtistPortfolio, 'id' | 'artist_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const { data, error } = await supabase
        .from('artist_portfolios')
        .insert([{
          ...portfolio,
          artist_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setPortfolios(prev => [data, ...prev]);
      trackUserEngagement(user.id, 'portfolio_item_added');
      return true;
    } catch (err) {
      setPortfoliosError(err instanceof Error ? err.message : 'Failed to add portfolio item');
      return false;
    }
  }, [user, isArtist]);

  // Update Portfolio Item
  const updatePortfolioItem = useCallback(async (
    id: string, 
    updates: Partial<ArtistPortfolio>
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const { error } = await supabase
        .from('artist_portfolios')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('artist_id', user.id);
      
      if (error) throw error;
      
      setPortfolios(prev => 
        prev.map(item => item.id === id ? { ...item, ...updates } : item)
      );
      
      trackUserEngagement(user.id, 'portfolio_item_updated');
      return true;
    } catch (err) {
      setPortfoliosError(err instanceof Error ? err.message : 'Failed to update portfolio item');
      return false;
    }
  }, [user, isArtist]);

  // Delete Portfolio Item
  const deletePortfolioItem = useCallback(async (id: string): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const { error } = await supabase
        .from('artist_portfolios')
        .delete()
        .eq('id', id)
        .eq('artist_id', user.id);
      
      if (error) throw error;
      
      setPortfolios(prev => prev.filter(item => item.id !== id));
      trackUserEngagement(user.id, 'portfolio_item_deleted');
      return true;
    } catch (err) {
      setPortfoliosError(err instanceof Error ? err.message : 'Failed to delete portfolio item');
      return false;
    }
  }, [user, isArtist]);

  // Fetch Commission Requests
  const fetchCommissions = useCallback(async () => {
    if (!user || !isArtist) return;
    
    setCommissionsLoading(true);
    setCommissionsError(null);
    
    try {
      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          customer:profiles!commission_requests_customer_id_fkey(
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCommissionRequests(data || []);
      
      // Fetch messages for each commission
      if (data && data.length > 0) {
        const commissionIds = data.map(c => c.id);
        const { data: messages, error: messagesError } = await supabase
          .from('commission_messages')
          .select(`
            *,
            sender:profiles!commission_messages_sender_id_fkey(
              full_name,
              avatar_url
            )
          `)
          .in('commission_id', commissionIds)
          .order('created_at', { ascending: true });
        
        if (!messagesError && messages) {
          const groupedMessages: { [commissionId: string]: CommissionMessage[] } = {};
          messages.forEach(msg => {
            if (!groupedMessages[msg.commission_id]) {
              groupedMessages[msg.commission_id] = [];
            }
            groupedMessages[msg.commission_id].push(msg);
          });
          setCommissionMessages(groupedMessages);
        }
      }
      
      trackUserEngagement(user.id, 'commissions_viewed');
    } catch (err) {
      setCommissionsError(err instanceof Error ? err.message : 'Failed to fetch commissions');
    } finally {
      setCommissionsLoading(false);
    }
  }, [user, isArtist]);

  // Update Commission Status
  const updateCommissionStatus = useCallback(async (
    id: string,
    status: CommissionRequest['status'],
    notes?: string
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (notes) {
        updates.artist_notes = notes;
      }
      
      const { error } = await supabase
        .from('commission_requests')
        .update(updates)
        .eq('id', id)
        .eq('artist_id', user.id);
      
      if (error) throw error;
      
      setCommissionRequests(prev =>
        prev.map(req => req.id === id ? { ...req, ...updates } : req)
      );
      
      // Add status update message
      if (status !== 'pending') {
        await sendCommissionMessage(id, `Status updated to: ${status}${notes ? '. Notes: ' + notes : ''}`, [], true);
      }
      
      trackUserEngagement(user.id, 'commission_status_updated');
      return true;
    } catch (err) {
      setCommissionsError(err instanceof Error ? err.message : 'Failed to update commission status');
      return false;
    }
  }, [user, isArtist]);

  // Send Quote
  const sendQuote = useCallback(async (
    id: string,
    amount: number,
    details: string,
    estimatedCompletion?: string
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const updates = {
        status: 'quote_sent' as const,
        quote_amount: amount,
        quote_details: details,
        estimated_completion: estimatedCompletion || null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('commission_requests')
        .update(updates)
        .eq('id', id)
        .eq('artist_id', user.id);
      
      if (error) throw error;
      
      setCommissionRequests(prev =>
        prev.map(req => req.id === id ? { ...req, ...updates } : req)
      );
      
      // Add quote message
      await sendCommissionMessage(
        id, 
        `Quote sent: $${amount}. Details: ${details}${estimatedCompletion ? '. Estimated completion: ' + estimatedCompletion : ''}`,
        [],
        true
      );
      
      trackUserEngagement(user.id, 'commission_quote_sent');
      return true;
    } catch (err) {
      setCommissionsError(err instanceof Error ? err.message : 'Failed to send quote');
      return false;
    }
  }, [user, isArtist]);

  // Send Commission Message
  const sendCommissionMessage = useCallback(async (
    commissionId: string,
    message: string,
    attachments: string[] = [],
    isStatusUpdate: boolean = false
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const { data, error } = await supabase
        .from('commission_messages')
        .insert([{
          commission_id: commissionId,
          sender_id: user.id,
          message,
          attachments,
          is_status_update: isStatusUpdate
        }])
        .select(`
          *,
          sender:profiles!commission_messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .single();
      
      if (error) throw error;
      
      setCommissionMessages(prev => ({
        ...prev,
        [commissionId]: [...(prev[commissionId] || []), data]
      }));
      
      trackUserEngagement(user.id, 'commission_message_sent');
      return true;
    } catch (err) {
      setCommissionsError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [user, isArtist]);

  // Fetch Analytics Data
  const fetchAnalytics = useCallback(async () => {
    if (!user || !isArtist) return;
    
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    
    try {
      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .rpc('calculate_artist_earnings', { artist_uuid: user.id });
      
      if (earningsError) throw earningsError;
      setEarnings(earningsData);
      
      // Fetch top products
      const { data: productsData, error: productsError } = await supabase
        .rpc('get_artist_top_products', { artist_uuid: user.id, limit_count: 10 });
      
      if (productsError) throw productsError;
      setTopProducts(productsData || []);
      
      // Fetch commission metrics
      const { data: commissionData, error: commissionError } = await supabase
        .rpc('get_artist_commission_metrics', { artist_uuid: user.id });
      
      if (commissionError) throw commissionError;
      setCommissionMetrics(commissionData);
      
      // Fetch monthly earnings
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('artist_monthly_earnings')
        .select('*')
        .eq('artist_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);
      
      if (monthlyError) throw monthlyError;
      setMonthlyEarnings(monthlyData || []);
      
      trackUserEngagement(user.id, 'artist_analytics_viewed');
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user, isArtist]);

  // Fetch Earnings for specific period
  const fetchEarnings = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user || !isArtist) return;
    
    try {
      const { data, error } = await supabase
        .rpc('calculate_artist_earnings', {
          artist_uuid: user.id,
          start_date: startDate || null,
          end_date: endDate || null
        });
      
      if (error) throw error;
      setEarnings(data);
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to fetch earnings');
    }
  }, [user, isArtist]);

  // Fetch Payouts
  const fetchPayouts = useCallback(async () => {
    if (!user || !isArtist) return;
    
    setPayoutsLoading(true);
    setPayoutsError(null);
    
    try {
      const { data, error } = await supabase
        .from('artist_payouts')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPayouts(data || []);
      
      trackUserEngagement(user.id, 'payouts_viewed');
    } catch (err) {
      setPayoutsError(err instanceof Error ? err.message : 'Failed to fetch payouts');
    } finally {
      setPayoutsLoading(false);
    }
  }, [user, isArtist]);

  // Request Payout
  const requestPayout = useCallback(async (
    amount: number,
    method: string,
    details: any
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const { data, error } = await supabase
        .from('artist_payouts')
        .insert([{
          artist_id: user.id,
          amount,
          payout_method: method,
          payout_details: details,
          status: 'requested'
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setPayouts(prev => [data, ...prev]);
      trackUserEngagement(user.id, 'payout_requested');
      return true;
    } catch (err) {
      setPayoutsError(err instanceof Error ? err.message : 'Failed to request payout');
      return false;
    }
  }, [user, isArtist]);

  // Fetch Inventory Logs
  const fetchInventoryLogs = useCallback(async () => {
    if (!user || !isArtist) return;
    
    setInventoryLoading(true);
    setInventoryError(null);
    
    try {
      const { data, error } = await supabase
        .from('artist_inventory_logs')
        .select(`
          *,
          product:products!artist_inventory_logs_product_id_fkey(
            name,
            image_url
          )
        `)
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setInventoryLogs(data || []);
      
      trackUserEngagement(user.id, 'inventory_logs_viewed');
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : 'Failed to fetch inventory logs');
    } finally {
      setInventoryLoading(false);
    }
  }, [user, isArtist]);

  // Update Product Stock
  const updateProductStock = useCallback(async (
    productId: string,
    newStock: number,
    reason?: string
  ): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      // Get current stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .eq('artist_id', user.id)
        .single();
      
      if (productError) throw productError;
      
      const previousStock = product.stock_quantity;
      const quantityChange = newStock - previousStock;
      
      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId)
        .eq('artist_id', user.id);
      
      if (updateError) throw updateError;
      
      // Log the inventory change
      const { error: logError } = await supabase
        .from('artist_inventory_logs')
        .insert([{
          product_id: productId,
          artist_id: user.id,
          action: quantityChange > 0 ? 'stock_added' : 'adjustment',
          quantity_change: quantityChange,
          previous_stock: previousStock,
          new_stock: newStock,
          reason: reason || 'Manual adjustment'
        }]);
      
      if (logError) throw logError;
      
      // Refresh inventory logs
      await fetchInventoryLogs();
      
      trackUserEngagement(user.id, 'product_stock_updated');
      return true;
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : 'Failed to update product stock');
      return false;
    }
  }, [user, isArtist, fetchInventoryLogs]);

  // Update Artist Profile
  const updateArtistProfile = useCallback(async (updates: any): Promise<boolean> => {
    if (!user || !isArtist) return false;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (error) throw error;
      
      trackUserEngagement(user.id, 'artist_profile_updated');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  }, [user, isArtist]);

  // Refresh All Data
  const refreshData = useCallback(async () => {
    if (!user || !isArtist) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchPortfolios(),
        fetchCommissions(),
        fetchAnalytics(),
        fetchPayouts(),
        fetchInventoryLogs()
      ]);
    } finally {
      setLoading(false);
    }
  }, [user, isArtist, fetchPortfolios, fetchCommissions, fetchAnalytics, fetchPayouts, fetchInventoryLogs]);

  // Initial load
  useEffect(() => {
    if (user && isArtist) {
      refreshData();
    } else {
      setLoading(false);
    }
  }, [user, isArtist, refreshData]);

  return {
    // Portfolio Management
    portfolios,
    portfoliosLoading,
    portfoliosError,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    
    // Commission Management
    commissionRequests,
    commissionMessages,
    commissionsLoading,
    commissionsError,
    updateCommissionStatus,
    sendQuote,
    sendCommissionMessage,
    
    // Sales Analytics
    earnings,
    topProducts,
    commissionMetrics,
    monthlyEarnings,
    analyticsLoading,
    analyticsError,
    fetchEarnings,
    
    // Payout Management
    payouts,
    payoutsLoading,
    payoutsError,
    requestPayout,
    
    // Inventory Management
    inventoryLogs,
    inventoryLoading,
    inventoryError,
    updateProductStock,
    
    // Profile Management
    updateArtistProfile,
    
    // Loading States
    loading,
    error,
    
    // Utility Functions
    refreshData
  };
};