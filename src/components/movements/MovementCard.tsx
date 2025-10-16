import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MovementCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerImage: string;
  goalAmount: number;
  currentAmount: number;
  participantCount: number;
  endDate?: string;
  className?: string;
}

export const MovementCard: React.FC<MovementCardProps> = ({
  slug,
  title,
  description,
  bannerImage,
  goalAmount,
  currentAmount,
  participantCount,
  endDate,
  className,
}) => {
  const progressPercentage = Math.min((currentAmount / goalAmount) * 100, 100);
  const daysLeft = endDate
    ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link to={`/movements/${slug}`} className="block group">
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}>
        <div className="relative h-48 overflow-hidden">
          <img
            src={bannerImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {daysLeft !== null && daysLeft > 0 && (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </div>
          )}
        </div>

        <CardHeader>
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {description}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">
                ${currentAmount.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                of ${goalAmount.toLocaleString()}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>{progressPercentage.toFixed(0)}% funded</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{participantCount.toLocaleString()} supporters</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          Click to learn more and support this movement
        </CardFooter>
      </Card>
    </Link>
  );
};
