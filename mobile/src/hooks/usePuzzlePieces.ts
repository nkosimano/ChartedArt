import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PuzzlePiece, PuzzlePieceStatus } from '../components/puzzle/PuzzlePieceGrid';

export interface Reservation {
  pieceId: string;
  pieceNumber: number;
  expiresAt: string;
}

export const usePuzzlePieces = (movementId: string) => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [totalPieces, setTotalPieces] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPieces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('puzzle_pieces')
        .select('*')
        .eq('movement_id', movementId)
        .order('piece_number', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedPieces: PuzzlePiece[] = (data || []).map((piece: any) => ({
        id: piece.id,
        number: piece.piece_number,
        imageUrl: piece.image_url,
        status: piece.status as PuzzlePieceStatus,
        price: piece.price,
        reservedUntil: piece.reserved_until,
      }));

      setPieces(formattedPieces);
      setTotalPieces(formattedPieces.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch puzzle pieces');
      console.error('Error fetching puzzle pieces:', err);
    } finally {
      setIsLoading(false);
    }
  }, [movementId]);

  useEffect(() => {
    if (movementId) {
      fetchPieces();

      const subscription = supabase
        .channel(`puzzle_pieces:${movementId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'puzzle_pieces',
            filter: `movement_id=eq.${movementId}`,
          },
          () => {
            fetchPieces();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [movementId, fetchPieces]);

  return {
    pieces,
    totalPieces,
    isLoading,
    error,
    refetch: fetchPieces,
  };
};

export const useReservePuzzlePiece = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reservePiece = useCallback(async (pieceId: string): Promise<Reservation> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to reserve a piece');
      }

      const response = await fetch('/api/puzzle-pieces/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reserve piece');
      }

      const data = await response.json();
      
      return {
        pieceId: data.pieceId,
        pieceNumber: data.pieceNumber,
        expiresAt: data.expiresAt,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve piece';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reservePiece,
    isLoading,
    error,
  };
};

export const useCancelReservation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelReservation = useCallback(async (pieceId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/puzzle-pieces/cancel-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel reservation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel reservation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    cancelReservation,
    isLoading,
    error,
  };
};

export const useActiveReservation = () => {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkReservation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setReservation(null);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('puzzle_pieces')
          .select('id, piece_number, reserved_until')
          .eq('reserved_by', user.id)
          .eq('status', 'reserved')
          .gt('reserved_until', new Date().toISOString())
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setReservation({
            pieceId: data.id,
            pieceNumber: data.piece_number,
            expiresAt: data.reserved_until,
          });
        } else {
          setReservation(null);
        }
      } catch (err) {
        console.error('Error checking reservation:', err);
        setReservation(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkReservation();

    const interval = setInterval(checkReservation, 10000);
    return () => clearInterval(interval);
  }, []);

  return { reservation, isLoading };
};
