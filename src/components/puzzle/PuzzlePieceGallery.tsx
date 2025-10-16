import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lock, CheckCircle, Clock } from 'lucide-react';

export type PuzzlePieceStatus = 'available' | 'reserved' | 'sold';

export interface PuzzlePiece {
  id: string;
  number: number;
  imageUrl: string;
  status: PuzzlePieceStatus;
  price: number;
  reservedUntil?: string;
}

export interface PuzzlePieceGalleryProps {
  pieces: PuzzlePiece[];
  totalPieces: number;
  onPieceClick: (piece: PuzzlePiece) => void;
  className?: string;
}

const statusConfig = {
  available: {
    label: 'Available',
    icon: null,
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
    cardClassName: 'hover:shadow-lg hover:scale-105 cursor-pointer',
  },
  reserved: {
    label: 'Reserved',
    icon: Clock,
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    cardClassName: 'opacity-75 cursor-not-allowed',
  },
  sold: {
    label: 'Sold',
    icon: CheckCircle,
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cardClassName: 'opacity-50 cursor-not-allowed',
  },
};

export const PuzzlePieceGallery: React.FC<PuzzlePieceGalleryProps> = ({
  pieces,
  totalPieces,
  onPieceClick,
  className,
}) => {
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);

  const availableCount = pieces.filter(p => p.status === 'available').length;
  const soldCount = pieces.filter(p => p.status === 'sold').length;
  const reservedCount = pieces.filter(p => p.status === 'reserved').length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Puzzle Pieces</h2>
          <p className="text-muted-foreground">
            Collect unique pieces of this exclusive artwork
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{availableCount}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{reservedCount}</p>
            <p className="text-xs text-muted-foreground">Reserved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-500">{soldCount}</p>
            <p className="text-xs text-muted-foreground">Sold</p>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {pieces.map((piece) => {
          const config = statusConfig[piece.status];
          const Icon = config.icon;
          const isClickable = piece.status === 'available';

          return (
            <Card
              key={piece.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                config.cardClassName,
                hoveredPiece === piece.id && isClickable && "ring-2 ring-primary"
              )}
              onClick={() => isClickable && onPieceClick(piece)}
              onMouseEnter={() => setHoveredPiece(piece.id)}
              onMouseLeave={() => setHoveredPiece(null)}
            >
              {/* Image */}
              <div className="aspect-square relative">
                <img
                  src={piece.imageUrl}
                  alt={`Piece ${piece.number}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Overlay on hover for available pieces */}
                {isClickable && hoveredPiece === piece.id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity">
                    <div className="text-white text-center">
                      <p className="text-sm font-medium">Click to reserve</p>
                      <p className="text-lg font-bold">${piece.price}</p>
                    </div>
                  </div>
                )}

                {/* Lock icon for non-available pieces */}
                {!isClickable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Info Footer */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    #{piece.number} of {totalPieces}
                  </span>
                  <Badge variant="outline" className={config.className}>
                    {Icon && <Icon className="w-3 h-3 mr-1" />}
                    {config.label}
                  </Badge>
                </div>
                
                {piece.status === 'available' && (
                  <p className="text-sm font-bold text-primary">
                    ${piece.price}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {pieces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No puzzle pieces available yet.</p>
        </div>
      )}
    </div>
  );
};
