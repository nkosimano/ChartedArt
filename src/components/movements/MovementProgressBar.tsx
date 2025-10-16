import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface MovementProgressBarProps {
  currentAmount: number;
  goalAmount: number;
  animated?: boolean;
  showLabels?: boolean;
  className?: string;
}

export const MovementProgressBar: React.FC<MovementProgressBarProps> = ({
  currentAmount,
  goalAmount,
  animated = true,
  showLabels = true,
  className,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const actualProgress = Math.min((currentAmount / goalAmount) * 100, 100);

  useEffect(() => {
    if (animated) {
      // Animate the progress bar filling
      const timer = setTimeout(() => {
        setDisplayProgress(actualProgress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(actualProgress);
    }
  }, [actualProgress, animated]);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabels && (
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">
            ${currentAmount.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            of ${goalAmount.toLocaleString()} goal
          </span>
        </div>
      )}
      
      <Progress 
        value={displayProgress} 
        className={cn(
          "h-3",
          animated && "transition-all duration-1000 ease-out"
        )}
      />
      
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-primary">
            {actualProgress.toFixed(1)}% funded
          </span>
          <span className="text-muted-foreground">
            ${(goalAmount - currentAmount).toLocaleString()} to go
          </span>
        </div>
      )}
    </div>
  );
};
