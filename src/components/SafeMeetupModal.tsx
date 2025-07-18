import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import SafeMeetupSpots from './SafeMeetupSpots';

interface SafeMeetupModalProps {
  trigger?: React.ReactNode;
  radiusKm?: number;
}

const SafeMeetupModal: React.FC<SafeMeetupModalProps> = ({ 
  trigger, 
  radiusKm = 25 
}) => {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      Safe MeetUp
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safe MeetUp Spots
          </DialogTitle>
          <DialogDescription>
            Find secure, monitored locations to safely meet with buyers and sellers.
            These locations are verified and equipped with security features.
          </DialogDescription>
        </DialogHeader>
        
        <SafeMeetupSpots radiusKm={radiusKm} />
      </DialogContent>
    </Dialog>
  );
};

export default SafeMeetupModal;