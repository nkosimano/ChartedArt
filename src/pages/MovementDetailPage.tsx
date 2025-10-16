import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MovementDetailHero, ParticipantAvatarStack, DonationModal } from '@/components/movements';
import { PuzzlePieceGallery, PuzzlePieceDetailModal, ReservationTimer } from '@/components/puzzle';
import { useMovement, useMovementMetrics, useJoinMovement, useIsMovementParticipant } from '@/hooks/useMovements';
import { usePuzzlePieces, useReservePuzzlePiece, useCancelReservation, useActiveReservation } from '@/hooks/usePuzzlePieces';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PuzzlePiece } from '@/components/puzzle';

export const MovementDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { movement, isLoading: movementLoading, error: movementError } = useMovement(slug || '');
  const { metrics, refetch: refetchMetrics } = useMovementMetrics(movement?.id || '', true);
  const { isParticipant } = useIsMovementParticipant(movement?.id || '');
  const { joinMovement } = useJoinMovement();
  const { pieces, totalPieces } = usePuzzlePieces(movement?.id || '');
  const { reservePiece } = useReservePuzzlePiece();
  const { cancelReservation } = useCancelReservation();
  const { reservation } = useActiveReservation();

  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [isPieceModalOpen, setIsPieceModalOpen] = useState(false);

  if (movementLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (movementError || !movement) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {movementError || 'Movement not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleJoin = async () => {
    try {
      await joinMovement(movement.id);
      toast.success('Successfully joined the movement!');
      refetchMetrics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join movement');
    }
  };

  const handleDonate = () => {
    setIsDonationModalOpen(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: movement.title,
        text: movement.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleDonationSuccess = (amount: number) => {
    toast.success(`Thank you for your $${amount} donation!`);
    refetchMetrics();
  };

  const handlePieceClick = (piece: PuzzlePiece) => {
    setSelectedPiece(piece);
    setIsPieceModalOpen(true);
  };

  const handleReservePiece = async (pieceId: string) => {
    try {
      const newReservation = await reservePiece(pieceId);
      toast.success(`Piece #${newReservation.pieceNumber} reserved! Complete your purchase within 15 minutes.`);
      setIsPieceModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reserve piece');
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    
    try {
      await cancelReservation(reservation.pieceId);
      toast.info('Reservation cancelled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel reservation');
    }
  };

  const handleReservationExpire = () => {
    toast.warning('Your reservation has expired');
  };

  const handleCheckout = () => {
    // Navigate to checkout with the reserved piece
    window.location.href = `/checkout?reservedPiece=${reservation?.pieceId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Active Reservation Banner */}
      {reservation && (
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            <ReservationTimer
              pieceNumber={reservation.pieceNumber}
              expiresAt={reservation.expiresAt}
              onExpire={handleReservationExpire}
              onCheckout={handleCheckout}
              onCancel={handleCancelReservation}
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <MovementDetailHero
        title={movement.title}
        description={movement.description}
        bannerImage={movement.banner_image}
        goalAmount={movement.goal_amount}
        currentAmount={metrics?.currentAmount || movement.current_amount}
        participantCount={metrics?.participantCount || movement.participant_count}
        endDate={movement.end_date}
        onJoin={handleJoin}
        onDonate={handleDonate}
        onShare={handleShare}
        isJoined={isParticipant}
      />

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="about" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="puzzle">Puzzle Pieces</TabsTrigger>
            <TabsTrigger value="supporters">Supporters</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">About This Movement</h2>
              <div className="prose prose-lg dark:prose-invert">
                <p>{movement.long_description || movement.description}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="puzzle">
            <PuzzlePieceGallery
              pieces={pieces}
              totalPieces={totalPieces}
              onPieceClick={handlePieceClick}
            />
          </TabsContent>

          <TabsContent value="supporters">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Supporters</h2>
              {metrics?.recentParticipants && metrics.recentParticipants.length > 0 ? (
                <ParticipantAvatarStack
                  participants={metrics.recentParticipants}
                  maxDisplay={10}
                  size="lg"
                />
              ) : (
                <p className="text-muted-foreground">Be the first to support this movement!</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        movementId={movement.id}
        movementTitle={movement.title}
        onSuccess={handleDonationSuccess}
      />

      <PuzzlePieceDetailModal
        piece={selectedPiece}
        isOpen={isPieceModalOpen}
        onClose={() => setIsPieceModalOpen(false)}
        onReserve={handleReservePiece}
        totalPieces={totalPieces}
      />
    </div>
  );
};

export default MovementDetailPage;
