import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useShipping, CalculatedShippingRate } from '@/hooks/useShipping';
import { Calculator, Package, Truck } from 'lucide-react';

interface ShippingCalculatorProps {
  fromZip?: string;
  onRateSelect?: (rate: CalculatedShippingRate) => void;
}

export const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  fromZip = '10001',
  onRateSelect
}) => {
  const [toZip, setToZip] = useState('');
  const [weight, setWeight] = useState('1');
  const [dimensions, setDimensions] = useState({
    length: '10',
    width: '8',
    height: '6'
  });
  const [rates, setRates] = useState<CalculatedShippingRate[]>([]);
  const [calculating, setCalculating] = useState(false);

  const { calculateShippingRates } = useShipping();

  const handleCalculate = async () => {
    if (!toZip.trim()) return;

    setCalculating(true);
    try {
      const calculatedRates = await calculateShippingRates({
        fromZip,
        toZip: toZip.trim(),
        weight: parseFloat(weight) || 1,
        length: parseFloat(dimensions.length) || 10,
        width: parseFloat(dimensions.width) || 8,
        height: parseFloat(dimensions.height) || 6
      });
      setRates(calculatedRates);
    } finally {
      setCalculating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Shipping Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fromZip">From ZIP Code</Label>
            <Input
              id="fromZip"
              value={fromZip}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toZip">To ZIP Code</Label>
            <Input
              id="toZip"
              value={toZip}
              onChange={(e) => setToZip(e.target.value)}
              placeholder="Enter destination ZIP"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="length">Length (in)</Label>
            <Input
              id="length"
              type="number"
              value={dimensions.length}
              onChange={(e) => setDimensions(prev => ({...prev, length: e.target.value}))}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Width (in)</Label>
            <Input
              id="width"
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions(prev => ({...prev, width: e.target.value}))}
              min="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (in)</Label>
            <Input
              id="height"
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions(prev => ({...prev, height: e.target.value}))}
              min="1"
            />
          </div>
        </div>

        <Button 
          onClick={handleCalculate} 
          disabled={calculating || !toZip.trim()}
          className="w-full"
        >
          <Package className="h-4 w-4 mr-2" />
          {calculating ? 'Calculating...' : 'Calculate Shipping Rates'}
        </Button>

        {/* Results */}
        {rates.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Available Shipping Options</h3>
              <div className="space-y-3">
                {rates.map((rate, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onRateSelect?.(rate)}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{rate.service}</p>
                        <p className="text-sm text-muted-foreground">
                          {rate.deliveryDays} • {rate.carrier}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {rate.cost === 0 ? 'FREE' : formatPrice(rate.cost)}
                      </p>
                      {rate.cost === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Free Shipping
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};