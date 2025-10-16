import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';

export interface Movement {
  id: string;
  slug: string;
  title: string;
  description: string;
  long_description?: string;
  banner_image: string;
  goal_amount: number;
  current_amount: number;
  participant_count: number;
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const useMovements = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('movements')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMovements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movements');
      console.error('Error fetching movements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    isLoading,
    error,
    refetch: fetchMovements,
  };
};

export const useMovement = (slugOrId: string) => {
  const [movement, setMovement] = useState<Movement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovement = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase.from('movements').select('*');
      
      if (slugOrId.includes('-')) {
        query = query.eq('slug', slugOrId);
      } else {
        query = query.eq('id', slugOrId);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) throw fetchError;

      setMovement(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movement');
      console.error('Error fetching movement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [slugOrId]);

  useEffect(() => {
    if (slugOrId) {
      fetchMovement();
    }
  }, [slugOrId, fetchMovement]);

  return {
    movement,
    isLoading,
    error,
    refetch: fetchMovement,
  };
};

export const useJoinMovement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinMovement = useCallback(async (movementId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to join a movement');
      }

      const { error: insertError } = await supabase
        .from('movement_participants')
        .insert({
          movement_id: movementId,
          user_id: user.id,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('You have already joined this movement');
        }
        throw insertError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join movement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    joinMovement,
    isLoading,
    error,
  };
};

export const useIsMovementParticipant = (movementId: string) => {
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkParticipation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsParticipant(false);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('movement_participants')
          .select('id')
          .eq('movement_id', movementId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setIsParticipant(!!data);
      } catch (err) {
        console.error('Error checking participation:', err);
        setIsParticipant(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (movementId) {
      checkParticipation();
    }
  }, [movementId]);

  return { isParticipant, isLoading };
};
