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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DollarSign, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe (you'll need to set your publishable key)
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementId: string;
  movementTitle: string;
  onSuccess?: (amount: number) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

const DonationForm: React.FC<{
  movementId: string;
  movementTitle: string;
  onSuccess?: (amount: number) => void;
  onClose: () => void;
}> = ({ movementId, onSuccess, onClose }) => {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement cash/bank transfer payment flow
    alert(`Thank you for your interest in donating $${amount.toFixed(2)}! Cash payment options coming soon.`);
    onSuccess?.(amount);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label>Select or enter an amount</Label>
        
        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={amount === preset && !customAmount ? 'default' : 'outline'}
              onClick={() => handleAmountSelect(preset)}
              className="h-12"
            >
              ${preset}
            </Button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            className="pl-9"
            min="1"
            step="0.01"
          />
        </div>

        {/* Selected Amount Display */}
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Your donation</p>
          <p className="text-3xl font-bold">${amount.toFixed(2)}</p>
        </div>

        {/* Cash Payment Notice */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Cash Payment:</strong> We currently accept cash payments only. 
            Contact information will be provided after submitting.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          <Heart className="w-4 h-4 mr-2" />
          Continue with Cash Payment
        </Button>
      </DialogFooter>
    </form>
  );
};

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  movementId,
  movementTitle,
  onSuccess,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Support {movementTitle}</DialogTitle>
          <DialogDescription>
            Your donation will directly support this movement and help us reach our goal.
            Every contribution makes a difference!
          </DialogDescription>
        </DialogHeader>

        <DonationForm
          movementId={movementId}
          movementTitle={movementTitle}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
