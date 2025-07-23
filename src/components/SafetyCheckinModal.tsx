import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, MapPin, Clock, Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSafetyCheckins, TrustedContact } from '@/hooks/useSafetyCheckins';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SafetyCheckinModalProps {
  trigger?: React.ReactNode;
  adId?: string;
  defaultLocation?: string;
  onCheckinCreated?: () => void;
}

const SafetyCheckinModal: React.FC<SafetyCheckinModalProps> = ({ 
  trigger, 
  adId,
  defaultLocation = '',
  onCheckinCreated
}) => {
  const { trustedContacts, createCheckin, loading } = useSafetyCheckins();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    meetup_location: defaultLocation,
    meetup_address: '',
    scheduled_time: '',
    expected_duration_minutes: 60,
    notes: '',
    contact_person_name: '',
    contact_person_phone: '',
    emergency_contacts: [] as string[],
    share_location: true
  });

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      Create Safety Check-in
    </Button>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meetup_location || !formData.scheduled_time) {
      toast.error('Please fill in the required fields');
      return;
    }

    try {
      await createCheckin({
        ad_id: adId,
        meetup_location: formData.meetup_location,
        meetup_address: formData.meetup_address,
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
        expected_duration_minutes: formData.expected_duration_minutes,
        notes: formData.notes,
        contact_person_name: formData.contact_person_name,
        contact_person_phone: formData.contact_person_phone,
        emergency_contacts: formData.emergency_contacts
      });

      setOpen(false);
      setFormData({
        meetup_location: '',
        meetup_address: '',
        scheduled_time: '',
        expected_duration_minutes: 60,
        notes: '',
        contact_person_name: '',
        contact_person_phone: '',
        emergency_contacts: [],
        share_location: true
      });
      
      onCheckinCreated?.();
    } catch (error) {
      console.error('Error creating check-in:', error);
      toast.error('Failed to create safety check-in');
    }
  };

  const handleContactSelection = (contactId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: checked 
        ? [...prev.emergency_contacts, contactId]
        : prev.emergency_contacts.filter(id => id !== contactId)
    }));
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
    return format(now, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Create Safety Check-in
          </DialogTitle>
          <DialogDescription>
            Share your meetup details with trusted contacts for enhanced safety during transactions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meetup Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Meetup Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Meetup Location *</Label>
                <Input
                  id="location"
                  value={formData.meetup_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetup_location: e.target.value }))}
                  placeholder="e.g., Central Coffee Shop, Main Street Mall"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Full Address (Optional)</Label>
                <Input
                  id="address"
                  value={formData.meetup_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetup_address: e.target.value }))}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_time">Meeting Time *</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    min={getMinDateTime()}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Expected Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.expected_duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, expected_duration_minutes: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="480"
                    step="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Person You're Meeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_name">Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_person_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Phone Number</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_person_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trustedContacts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="mb-2">No trusted contacts found.</p>
                  <p className="text-sm">Add trusted contacts in your profile settings first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trustedContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={contact.id}
                        checked={formData.emergency_contacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                      />
                      <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                        <div>
                          <span className="font-medium">{contact.contact_name}</span>
                          {contact.relationship && (
                            <span className="ml-2 text-sm text-muted-foreground">({contact.relationship})</span>
                          )}
                        </div>
                        {contact.contact_phone && (
                          <div className="text-sm text-muted-foreground">{contact.contact_phone}</div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional details about the meetup..."
              rows={3}
            />
          </div>

          {/* Location Sharing Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="share_location"
              checked={formData.share_location}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, share_location: checked }))}
            />
            <Label htmlFor="share_location">
              Share real-time location updates with emergency contacts
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Safety Check-in'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyCheckinModal;