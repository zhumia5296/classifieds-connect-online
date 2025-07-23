import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  DollarSign,
  Truck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useDeliveryNetwork } from '@/hooks/useDeliveryNetwork';
import LocationInput from '@/components/LocationInput';
import { toast } from 'sonner';

interface DeliveryRequestFormProps {
  onSuccess?: (request: any) => void;
  onCancel?: () => void;
}

export const DeliveryRequestForm: React.FC<DeliveryRequestFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { createDeliveryRequest, loading } = useDeliveryNetwork();
  const [formData, setFormData] = useState({
    // Pickup details
    pickup_address: '',
    pickup_latitude: 0,
    pickup_longitude: 0,
    pickup_contact_name: '',
    pickup_contact_phone: '',
    pickup_instructions: '',
    pickup_time_window_start: '',
    pickup_time_window_end: '',
    
    // Delivery details
    delivery_address: '',
    delivery_latitude: 0,
    delivery_longitude: 0,
    delivery_contact_name: '',
    delivery_contact_phone: '',
    delivery_instructions: '',
    delivery_time_window_start: '',
    delivery_time_window_end: '',
    
    // Package details
    package_description: '',
    package_weight_kg: '',
    package_value: '',
    special_handling: [] as string[],
    
    // Delivery preferences
    delivery_type: 'standard',
    urgency_level: 'normal',
    signature_required: false,
    photo_confirmation_required: false,
    customer_budget: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const specialHandlingOptions = [
    'fragile',
    'refrigerated',
    'urgent',
    'heavy',
    'valuable',
    'documents',
    'liquids',
    'electronics'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.pickup_address) newErrors.pickup_address = 'Pickup address is required';
    if (!formData.pickup_contact_name) newErrors.pickup_contact_name = 'Pickup contact name is required';
    if (!formData.pickup_contact_phone) newErrors.pickup_contact_phone = 'Pickup contact phone is required';
    if (!formData.delivery_address) newErrors.delivery_address = 'Delivery address is required';
    if (!formData.delivery_contact_name) newErrors.delivery_contact_name = 'Delivery contact name is required';
    if (!formData.delivery_contact_phone) newErrors.delivery_contact_phone = 'Delivery contact phone is required';
    if (!formData.package_description) newErrors.package_description = 'Package description is required';

    // Validate coordinates
    if (formData.pickup_latitude === 0 || formData.pickup_longitude === 0) {
      newErrors.pickup_address = 'Please select a valid pickup location';
    }
    if (formData.delivery_latitude === 0 || formData.delivery_longitude === 0) {
      newErrors.delivery_address = 'Please select a valid delivery location';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const requestData = {
        ...formData,
        package_weight_kg: formData.package_weight_kg ? parseFloat(formData.package_weight_kg) : null,
        package_value: formData.package_value ? parseFloat(formData.package_value) : null,
        customer_budget: formData.customer_budget ? parseFloat(formData.customer_budget) : null,
        pickup_time_window_start: formData.pickup_time_window_start || null,
        pickup_time_window_end: formData.pickup_time_window_end || null,
        delivery_time_window_start: formData.delivery_time_window_start || null,
        delivery_time_window_end: formData.delivery_time_window_end || null,
      };

      const result = await createDeliveryRequest(requestData);
      toast.success('Delivery request created successfully!');
      onSuccess?.(result);
    } catch (error) {
      console.error('Error creating delivery request:', error);
      toast.error('Failed to create delivery request');
    }
  };

  const handleSpecialHandlingChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      special_handling: checked 
        ? [...prev.special_handling, option]
        : prev.special_handling.filter(item => item !== option)
    }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pickup Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Pickup Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pickup_address">Pickup Address *</Label>
            <LocationInput
              value={formData.pickup_address}
              onChange={(address, coords) => {
                updateFormData('pickup_address', address);
                if (coords) {
                  updateFormData('pickup_latitude', coords.latitude);
                  updateFormData('pickup_longitude', coords.longitude);
                }
              }}
              placeholder="Enter pickup address"
            />
            {errors.pickup_address && (
              <p className="text-sm text-destructive">{errors.pickup_address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup_contact_name">Contact Name *</Label>
              <Input
                id="pickup_contact_name"
                value={formData.pickup_contact_name}
                onChange={(e) => updateFormData('pickup_contact_name', e.target.value)}
                placeholder="Contact person name"
                className={errors.pickup_contact_name ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup_contact_phone">Contact Phone *</Label>
              <Input
                id="pickup_contact_phone"
                value={formData.pickup_contact_phone}
                onChange={(e) => updateFormData('pickup_contact_phone', e.target.value)}
                placeholder="Phone number"
                className={errors.pickup_contact_phone ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_instructions">Special Instructions</Label>
            <Textarea
              id="pickup_instructions"
              value={formData.pickup_instructions}
              onChange={(e) => updateFormData('pickup_instructions', e.target.value)}
              placeholder="Any special pickup instructions..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup_time_start">Pickup Window Start</Label>
              <Input
                id="pickup_time_start"
                type="datetime-local"
                value={formData.pickup_time_window_start}
                onChange={(e) => updateFormData('pickup_time_window_start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup_time_end">Pickup Window End</Label>
              <Input
                id="pickup_time_end"
                type="datetime-local"
                value={formData.pickup_time_window_end}
                onChange={(e) => updateFormData('pickup_time_window_end', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Delivery Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delivery_address">Delivery Address *</Label>
            <LocationInput
              value={formData.delivery_address}
              onChange={(address, coords) => {
                updateFormData('delivery_address', address);
                if (coords) {
                  updateFormData('delivery_latitude', coords.latitude);
                  updateFormData('delivery_longitude', coords.longitude);
                }
              }}
              placeholder="Enter delivery address"
            />
            {errors.delivery_address && (
              <p className="text-sm text-destructive">{errors.delivery_address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_contact_name">Contact Name *</Label>
              <Input
                id="delivery_contact_name"
                value={formData.delivery_contact_name}
                onChange={(e) => updateFormData('delivery_contact_name', e.target.value)}
                placeholder="Contact person name"
                className={errors.delivery_contact_name ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_contact_phone">Contact Phone *</Label>
              <Input
                id="delivery_contact_phone"
                value={formData.delivery_contact_phone}
                onChange={(e) => updateFormData('delivery_contact_phone', e.target.value)}
                placeholder="Phone number"
                className={errors.delivery_contact_phone ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
            <Textarea
              id="delivery_instructions"
              value={formData.delivery_instructions}
              onChange={(e) => updateFormData('delivery_instructions', e.target.value)}
              placeholder="Any special delivery instructions..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_time_start">Delivery Window Start</Label>
              <Input
                id="delivery_time_start"
                type="datetime-local"
                value={formData.delivery_time_window_start}
                onChange={(e) => updateFormData('delivery_time_window_start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_time_end">Delivery Window End</Label>
              <Input
                id="delivery_time_end"
                type="datetime-local"
                value={formData.delivery_time_window_end}
                onChange={(e) => updateFormData('delivery_time_window_end', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="package_description">Package Description *</Label>
            <Textarea
              id="package_description"
              value={formData.package_description}
              onChange={(e) => updateFormData('package_description', e.target.value)}
              placeholder="Describe what needs to be delivered..."
              rows={3}
              className={errors.package_description ? 'border-destructive' : ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="package_weight">Weight (kg)</Label>
              <Input
                id="package_weight"
                type="number"
                step="0.1"
                value={formData.package_weight_kg}
                onChange={(e) => updateFormData('package_weight_kg', e.target.value)}
                placeholder="Package weight"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="package_value">Declared Value ($)</Label>
              <Input
                id="package_value"
                type="number"
                step="0.01"
                value={formData.package_value}
                onChange={(e) => updateFormData('package_value', e.target.value)}
                placeholder="Package value"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Special Handling</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {specialHandlingOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={formData.special_handling.includes(option)}
                    onCheckedChange={(checked) => 
                      handleSpecialHandlingChange(option, checked as boolean)
                    }
                  />
                  <Label htmlFor={option} className="text-sm capitalize">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Delivery Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_type">Delivery Type</Label>
              <Select
                value={formData.delivery_type}
                onValueChange={(value) => updateFormData('delivery_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="same_day">Same Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency_level">Urgency Level</Label>
              <Select
                value={formData.urgency_level}
                onValueChange={(value) => updateFormData('urgency_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="signature_required"
                checked={formData.signature_required}
                onCheckedChange={(checked) => 
                  updateFormData('signature_required', checked as boolean)
                }
              />
              <Label htmlFor="signature_required">
                Signature required upon delivery
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="photo_confirmation"
                checked={formData.photo_confirmation_required}
                onCheckedChange={(checked) => 
                  updateFormData('photo_confirmation_required', checked as boolean)
                }
              />
              <Label htmlFor="photo_confirmation">
                Photo confirmation required
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_budget">Budget ($)</Label>
            <Input
              id="customer_budget"
              type="number"
              step="0.01"
              value={formData.customer_budget}
              onChange={(e) => updateFormData('customer_budget', e.target.value)}
              placeholder="Your budget for this delivery"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating Request...' : 'Create Delivery Request'}
        </Button>
      </div>
    </form>
  );
};