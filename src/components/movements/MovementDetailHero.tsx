import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, DollarSign, Calendar, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MovementDetailHeroProps {
  title: string;
  description: string;
  bannerImage: string;
  goalAmount: number;
  currentAmount: number;
  participantCount: number;
  endDate?: string;
  onJoin: () => void;
  onDonate: () => void;
  onShare: () => void;
  isJoined: boolean;
  isLoading?: boolean;
  className?: string;
}

export const MovementDetailHero: React.FC<MovementDetailHeroProps> = ({
  title,
  description,
  bannerImage,
  goalAmount,
  currentAmount,
  participantCount,
  endDate,
  onJoin,
  onDonate,
  onShare,
  isJoined,
  isLoading = false,
  className,
}) => {
  const progressPercentage = Math.min((currentAmount / goalAmount) * 100, 100);
  const daysLeft = endDate
    ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={cn("relative", className)}>
      {/* Banner Image */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <img
          src={bannerImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Share Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onShare}
          aria-label="Share movement"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Content Overlay */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-lg text-muted-foreground mb-6">{description}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Raised</span>
              </div>
              <p className="text-3xl font-bold">${currentAmount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                of ${goalAmount.toLocaleString()} goal
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Supporters</span>
              </div>
              <p className="text-3xl font-bold">{participantCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">people joined</p>
            </div>

            {daysLeft !== null && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Time Left</span>
                </div>
                <p className="text-3xl font-bold">{daysLeft}</p>
                <p className="text-sm text-muted-foreground">
                  {daysLeft === 1 ? 'day' : 'days'} remaining
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground text-right">
              {progressPercentage.toFixed(1)}% funded
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={onDonate}
              disabled={isLoading}
              className="flex-1"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Donate Now
            </Button>
            <Button
              size="lg"
              variant={isJoined ? "secondary" : "outline"}
              onClick={onJoin}
              disabled={isLoading || isJoined}
              className="flex-1"
            >
              <Users className="w-5 h-5 mr-2" />
              {isJoined ? 'Joined!' : 'Join the Movement'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
