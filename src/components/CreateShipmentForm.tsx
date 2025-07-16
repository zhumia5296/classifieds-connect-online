import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useShipping, ShippingAddress, PackageInfo } from '@/hooks/useShipping';
import { Package, Truck, Globe } from 'lucide-react';

interface CreateShipmentFormProps {
  orderId: string;
  onShipmentCreated?: (shipment: any) => void;
}

export const CreateShipmentForm: React.FC<CreateShipmentFormProps> = ({
  orderId,
  onShipmentCreated
}) => {
  const [fromAddress, setFromAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [toAddress, setToAddress] = useState<ShippingAddress>({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [packageInfo, setPackageInfo] = useState<PackageInfo>({
    weight: 1,
    length: 10,
    width: 8,
    height: 6
  });

  const [service, setService] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [customsInfo, setCustomsInfo] = useState({
    contents: '',
    value: 0,
    items: [
      {
        description: '',
        quantity: 1,
        value: 0,
        weight: 0.5
      }
    ]
  });
  const [creating, setCreating] = useState(false);

  const { createShipment } = useShipping();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const shipmentData = {
        orderId,
        service,
        fromAddress,
        toAddress,
        package: packageInfo,
        ...(isInternational && { customsInfo })
      };

      const shipment = await createShipment(shipmentData);
      onShipmentCreated?.(shipment);
    } catch (error) {
      console.error('Failed to create shipment:', error);
    } finally {
      setCreating(false);
    }
  };

  const updateFromAddress = (field: keyof ShippingAddress, value: string) => {
    setFromAddress(prev => ({ ...prev, [field]: value }));
  };

  const updateToAddress = (field: keyof ShippingAddress, value: string) => {
    setToAddress(prev => ({ ...prev, [field]: value }));
  };

  const updatePackageInfo = (field: keyof PackageInfo, value: number) => {
    setPackageInfo(prev => ({ ...prev, [field]: value }));
  };

  const addCustomsItem = () => {
    setCustomsInfo(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          value: 0,
          weight: 0.5
        }
      ]
    }));
  };

  const updateCustomsItem = (index: number, field: string, value: any) => {
    setCustomsInfo(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeCustomsItem = (index: number) => {
    setCustomsInfo(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create Shipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Address */}
          <div className="space-y-4">
            <h3 className="font-semibold">From Address (Seller)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">Name</Label>
                <Input
                  id="fromName"
                  value={fromAddress.name}
                  onChange={(e) => updateFromAddress('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromStreet">Street Address</Label>
                <Input
                  id="fromStreet"
                  value={fromAddress.street}
                  onChange={(e) => updateFromAddress('street', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromCity">City</Label>
                <Input
                  id="fromCity"
                  value={fromAddress.city}
                  onChange={(e) => updateFromAddress('city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromState">State</Label>
                <Input
                  id="fromState"
                  value={fromAddress.state}
                  onChange={(e) => updateFromAddress('state', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromZip">ZIP Code</Label>
                <Input
                  id="fromZip"
                  value={fromAddress.zip}
                  onChange={(e) => updateFromAddress('zip', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* To Address */}
          <div className="space-y-4">
            <h3 className="font-semibold">To Address (Buyer)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toName">Name</Label>
                <Input
                  id="toName"
                  value={toAddress.name}
                  onChange={(e) => updateToAddress('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toStreet">Street Address</Label>
                <Input
                  id="toStreet"
                  value={toAddress.street}
                  onChange={(e) => updateToAddress('street', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toCity">City</Label>
                <Input
                  id="toCity"
                  value={toAddress.city}
                  onChange={(e) => updateToAddress('city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toState">State</Label>
                <Input
                  id="toState"
                  value={toAddress.state}
                  onChange={(e) => updateToAddress('state', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toZip">ZIP Code</Label>
                <Input
                  id="toZip"
                  value={toAddress.zip}
                  onChange={(e) => updateToAddress('zip', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="international"
                checked={isInternational}
                onCheckedChange={(checked) => setIsInternational(checked as boolean)}
              />
              <Label htmlFor="international" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                International shipment
              </Label>
            </div>
          </div>

          <Separator />

          {/* Package Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Package Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={packageInfo.weight}
                  onChange={(e) => updatePackageInfo('weight', parseFloat(e.target.value))}
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  value={packageInfo.length}
                  onChange={(e) => updatePackageInfo('length', parseFloat(e.target.value))}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  value={packageInfo.width}
                  onChange={(e) => updatePackageInfo('width', parseFloat(e.target.value))}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  value={packageInfo.height}
                  onChange={(e) => updatePackageInfo('height', parseFloat(e.target.value))}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Shipping Service</Label>
            <Select value={service} onValueChange={setService} required>
              <SelectTrigger>
                <SelectValue placeholder="Select shipping service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ground">USPS Ground Advantage</SelectItem>
                <SelectItem value="priority">USPS Priority Mail</SelectItem>
                <SelectItem value="express">USPS Priority Mail Express</SelectItem>
                {isInternational && (
                  <SelectItem value="international">USPS Priority Mail International</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* International Customs */}
          {isInternational && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Customs Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contents">Contents Description</Label>
                    <Input
                      id="contents"
                      value={customsInfo.contents}
                      onChange={(e) => setCustomsInfo(prev => ({ ...prev, contents: e.target.value }))}
                      placeholder="e.g., Electronics, Clothing, Books"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Total Value (USD)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={customsInfo.value}
                      onChange={(e) => setCustomsInfo(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Customs Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCustomsItem}>
                      Add Item
                    </Button>
                  </div>
                  {customsInfo.items.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateCustomsItem(index, 'description', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCustomsItem(index, 'quantity', parseInt(e.target.value))}
                            min="1"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Value (USD)</Label>
                          <Input
                            type="number"
                            value={item.value}
                            onChange={(e) => updateCustomsItem(index, 'value', parseFloat(e.target.value))}
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Weight (lbs)</Label>
                          <Input
                            type="number"
                            value={item.weight}
                            onChange={(e) => updateCustomsItem(index, 'weight', parseFloat(e.target.value))}
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>
                      {customsInfo.items.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeCustomsItem(index)}
                        >
                          Remove Item
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button type="submit" disabled={creating} className="w-full">
            <Truck className="h-4 w-4 mr-2" />
            {creating ? 'Creating Shipment...' : 'Create Shipment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};