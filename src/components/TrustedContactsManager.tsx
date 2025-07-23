import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Trash2,
  Shield,
  Heart,
  User
} from 'lucide-react';
import { useSafetyCheckins, TrustedContact } from '@/hooks/useSafetyCheckins';
import { toast } from 'sonner';

const TrustedContactsManager: React.FC = () => {
  const { trustedContacts, addTrustedContact, removeTrustedContact, loading } = useSafetyCheckins();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    relationship: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contact_name) {
      toast.error('Contact name is required');
      return;
    }

    if (!formData.contact_phone && !formData.contact_email) {
      toast.error('Please provide either a phone number or email');
      return;
    }

    try {
      await addTrustedContact({
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone || undefined,
        contact_email: formData.contact_email || undefined,
        relationship: formData.relationship || undefined
      });

      setFormData({
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        relationship: ''
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding trusted contact:', error);
      toast.error('Failed to add trusted contact');
    }
  };

  const handleRemove = async (contactId: string) => {
    if (window.confirm('Are you sure you want to remove this trusted contact?')) {
      try {
        await removeTrustedContact(contactId);
      } catch (error) {
        console.error('Error removing trusted contact:', error);
        toast.error('Failed to remove trusted contact');
      }
    }
  };

  const getRelationshipIcon = (relationship?: string) => {
    switch (relationship?.toLowerCase()) {
      case 'family':
        return <Heart className="h-4 w-4" />;
      case 'friend':
        return <Users className="h-4 w-4" />;
      case 'partner':
      case 'spouse':
        return <Heart className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRelationshipColor = (relationship?: string) => {
    switch (relationship?.toLowerCase()) {
      case 'family':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'friend':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partner':
      case 'spouse':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Trusted Emergency Contacts
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Trusted Contact</DialogTitle>
                <DialogDescription>
                  Add someone who can be notified during your safety check-ins.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select 
                    value={formData.relationship} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="neighbor">Neighbor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Adding...' : 'Add Contact'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {trustedContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium mb-2">No trusted contacts yet</h3>
            <p className="text-sm mb-4">
              Add trusted contacts who can be notified during your safety check-ins.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {trustedContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    {getRelationshipIcon(contact.relationship)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{contact.contact_name}</span>
                      {contact.relationship && (
                        <Badge 
                          variant="outline" 
                          className={getRelationshipColor(contact.relationship)}
                        >
                          {contact.relationship}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {contact.contact_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{contact.contact_phone}</span>
                        </div>
                      )}
                      {contact.contact_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{contact.contact_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {contact.contact_phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${contact.contact_phone}`, '_self')}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(contact.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrustedContactsManager;