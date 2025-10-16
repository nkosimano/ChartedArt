import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Users, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JoinMovementButtonProps extends Omit<ButtonProps, 'onClick'> {
  movementId: string;
  isJoined: boolean;
  onJoin: (movementId: string) => Promise<void>;
  optimistic?: boolean;
}

export const JoinMovementButton: React.FC<JoinMovementButtonProps> = ({
  movementId,
  isJoined: initialIsJoined,
  onJoin,
  optimistic = true,
  className,
  ...props
}) => {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (isJoined || isLoading) return;

    setError(null);

    // Optimistic UI update
    if (optimistic) {
      setIsJoined(true);
    }

    setIsLoading(true);

    try {
      await onJoin(movementId);
      
      // If not optimistic, update after success
      if (!optimistic) {
        setIsJoined(true);
      }
    } catch (err) {
      // Revert optimistic update on error
      if (optimistic) {
        setIsJoined(false);
      }
      
      setError(err instanceof Error ? err.message : 'Failed to join movement');
      console.error('Error joining movement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleJoin}
        disabled={isJoined || isLoading}
        variant={isJoined ? 'secondary' : 'default'}
        className={cn(
          "transition-all duration-300",
          isJoined && "cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : isJoined ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Joined!
          </>
        ) : (
          <>
            <Users className="w-4 h-4 mr-2" />
            Join the Movement
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
