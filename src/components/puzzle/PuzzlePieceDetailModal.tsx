import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, ShoppingCart, Loader2, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PuzzlePiece, PuzzlePieceStatus } from './PuzzlePieceGallery';

export interface PuzzlePieceDetailModalProps {
  piece: PuzzlePiece | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (pieceId: string) => Promise<void>;
  totalPieces: number;
}

const statusConfig = {
  available: {
    label: 'Available',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  reserved: {
    label: 'Reserved',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  sold: {
    label: 'Sold',
    className: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  },
};

export const PuzzlePieceDetailModal: React.FC<PuzzlePieceDetailModalProps> = ({
  piece,
  isOpen,
  onClose,
  onReserve,
  totalPieces,
}) => {
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!piece) return null;

  const config = statusConfig[piece.status];
  const isAvailable = piece.status === 'available';

  const handleReserve = async () => {
    if (!isAvailable || isReserving) return;

    setIsReserving(true);
    setError(null);

    try {
      await onReserve(piece.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reserve piece');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Puzzle Piece #{piece.number}</DialogTitle>
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
          </div>
          <DialogDescription>
            Part {piece.number} of {totalPieces} in this exclusive collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="relative group">
            <div
              className={cn(
                "relative overflow-hidden rounded-lg bg-muted cursor-zoom-in",
                isZoomed && "cursor-zoom-out"
              )}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={piece.imageUrl}
                alt={`Piece ${piece.number}`}
                className={cn(
                  "w-full transition-transform duration-300",
                  isZoomed ? "scale-150" : "scale-100"
                )}
              />
              
              {/* Zoom indicator */}
              <div className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5" />
              </div>
            </div>
            
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <Lock className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">This piece is {piece.status}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Price</p>
                <p className="text-3xl font-bold">${piece.price}</p>
              </div>
              {piece.reservedUntil && piece.status === 'reserved' && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Reserved until</p>
                  <p className="text-sm font-semibold">
                    {new Date(piece.reservedUntil).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {isAvailable && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  How it works
                </h4>
                <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Reserve this piece for 15 minutes</li>
                  <li>• Complete your purchase within the time limit</li>
                  <li>• If time expires, the piece becomes available again</li>
                  <li>• Each piece is unique and can only be owned by one person</li>
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isReserving}>
            Close
          </Button>
          {isAvailable && (
            <Button onClick={handleReserve} disabled={isReserving}>
              {isReserving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reserving...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Reserve for ${piece.price}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
