import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ParticipantAvatarStackProps {
  participants: Participant[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const ParticipantAvatarStack: React.FC<ParticipantAvatarStackProps> = ({
  participants,
  maxDisplay = 5,
  size = 'md',
  className,
}) => {
  const displayedParticipants = participants.slice(0, maxDisplay);
  const remainingCount = Math.max(0, participants.length - maxDisplay);

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {displayedParticipants.map((participant, index) => (
          <Avatar
            key={participant.id}
            className={cn(
              sizeClasses[size],
              "border-2 border-background ring-2 ring-background",
              "transition-transform hover:scale-110 hover:z-10"
            )}
            style={{ zIndex: displayedParticipants.length - index }}
          >
            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(participant.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {remainingCount > 0 && (
          <div
            className={cn(
              sizeClasses[size],
              "rounded-full border-2 border-background bg-muted",
              "flex items-center justify-center text-xs font-medium",
              "text-muted-foreground"
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      
      {participants.length > 0 && (
        <span className="ml-3 text-sm text-muted-foreground">
          {participants.length === 1
            ? '1 supporter'
            : `${participants.length.toLocaleString()} supporters`}
        </span>
      )}
    </div>
  );
};
