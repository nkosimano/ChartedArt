import React from 'react';
import { MovementCard } from '@/components/movements';
import { useMovements } from '@/hooks/useMovements';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const MovementsPage: React.FC = () => {
  const { movements, isLoading, error } = useMovements();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join a Movement
            </h1>
            <p className="text-lg text-muted-foreground">
              Support social impact campaigns through art. Every contribution makes a difference
              in creating positive change in our communities.
            </p>
          </div>
        </div>
      </section>

      {/* Movements Grid */}
      <section className="container mx-auto px-4 py-12">
        {movements.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              No active movements at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Active Movements</h2>
              <p className="text-muted-foreground">
                {movements.length} {movements.length === 1 ? 'movement' : 'movements'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {movements.map((movement) => (
                <MovementCard
                  key={movement.id}
                  id={movement.id}
                  slug={movement.slug}
                  title={movement.title}
                  description={movement.description}
                  bannerImage={movement.banner_image}
                  goalAmount={movement.goal_amount}
                  currentAmount={movement.current_amount}
                  participantCount={movement.participant_count}
                  endDate={movement.end_date}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default MovementsPage;
