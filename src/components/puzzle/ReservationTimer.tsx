import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, X, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReservationTimerProps {
  pieceNumber: number;
  expiresAt: string;
  onExpire: () => void;
  onCheckout: () => void;
  onCancel: () => void;
  className?: string;
}

export const ReservationTimer: React.FC<ReservationTimerProps> = ({
  pieceNumber,
  expiresAt,
  onExpire,
  onCheckout,
  onCancel,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        onExpire();
        return 0;
      }

      return Math.floor(diff / 1000);
    };

    // Initial calculation
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 120; // Less than 2 minutes

  if (isExpired) {
    return (
      <Alert variant="destructive" className={cn("animate-in fade-in", className)}>
        <Clock className="h-4 w-4" />
        <AlertTitle>Reservation Expired</AlertTitle>
        <AlertDescription>
          Your reservation for Puzzle Piece #{pieceNumber} has expired. The piece is now available for others.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      className={cn(
        "border-2 transition-colors",
        isUrgent ? "border-destructive bg-destructive/10" : "border-primary bg-primary/10",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className={cn("h-4 w-4", isUrgent && "animate-pulse")} />
            <AlertTitle className="mb-0">
              Piece #{pieceNumber} Reserved
            </AlertTitle>
          </div>
          <AlertDescription>
            <div className="flex items-baseline gap-2">
              <span>Complete your purchase in</span>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  isUrgent && "text-destructive animate-pulse"
                )}
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </AlertDescription>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={onCheckout}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Checkout
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isUrgent ? "bg-destructive" : "bg-primary"
          )}
          style={{
            width: `${(timeLeft / (15 * 60)) * 100}%`,
          }}
        />
      </div>
    </Alert>
  );
};
