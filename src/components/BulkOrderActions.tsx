import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Order } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Download, 
  Mail, 
  FileText,
  MoreHorizontal 
} from 'lucide-react';

interface BulkOrderActionsProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectionChange: (orderIds: string[]) => void;
  onOrdersUpdate: () => void;
  userType: 'buyer' | 'seller';
}

export const BulkOrderActions: React.FC<BulkOrderActionsProps> = ({
  orders,
  selectedOrders,
  onSelectionChange,
  onOrdersUpdate,
  userType
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBulkShipping, setShowBulkShipping] = useState(false);
  const [shippingData, setShippingData] = useState({
    carrier: '',
    trackingNumber: '',
    notes: ''
  });

  const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
  const canMarkShipped = selectedOrdersData.every(order => order.status === 'paid');
  const canMarkDelivered = selectedOrdersData.every(order => order.status === 'shipped');

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map(order => order.id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedOrders);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedOrders.length} order(s) to ${newStatus}`,
      });

      onSelectionChange([]);
      onOrdersUpdate();
    } catch (error) {
      console.error('Error updating orders:', error);
      toast({
        title: "Error",
        description: "Failed to update orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkShipping = async () => {
    if (selectedOrders.length === 0 || !shippingData.carrier) return;

    setIsUpdating(true);
    try {
      // Update all selected orders with shipping info
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          carrier: shippingData.carrier,
          tracking_number: shippingData.trackingNumber || null,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedOrders);

      if (error) throw error;

      // Create shipments for each order
      const shipments = selectedOrders.map(orderId => {
        const order = selectedOrdersData.find(o => o.id === orderId);
        return {
          order_id: orderId,
          carrier: shippingData.carrier,
          tracking_number: shippingData.trackingNumber || null,
          status: 'in_transit',
          shipped_at: new Date().toISOString(),
          shipping_address: order?.shipping_address || {}
        };
      });

      await supabase.from('shipments').insert(shipments);

      toast({
        title: "Success",
        description: `Marked ${selectedOrders.length} order(s) as shipped`,
      });

      setShowBulkShipping(false);
      setShippingData({ carrier: '', trackingNumber: '', notes: '' });
      onSelectionChange([]);
      onOrdersUpdate();
    } catch (error) {
      console.error('Error updating shipping:', error);
      toast({
        title: "Error",
        description: "Failed to update shipping information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToCSV = () => {
    if (selectedOrders.length === 0) return;

    const csvData = selectedOrdersData.map(order => ({
      'Order ID': order.id.slice(-8),
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Status': order.status,
      'Total': order.total_amount,
      'Currency': order.currency,
      'Items': order.order_items.length,
      'Customer ID': order.user_id.slice(-8),
      'Seller ID': order.seller_id.slice(-8)
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Orders exported to CSV",
    });
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const totalValue = selectedOrdersData.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedOrders.length === orders.length}
              onCheckedChange={handleSelectAll}
            />
            <span>
              Bulk Actions ({selectedOrders.length} selected)
            </span>
          </div>
          {selectedOrders.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Total value: {formatPrice(totalValue)}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      {selectedOrders.length > 0 && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {/* Export Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            {/* Seller-specific actions */}
            {userType === 'seller' && (
              <>
                {canMarkShipped && (
                  <Dialog open={showBulkShipping} onOpenChange={setShowBulkShipping}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={isUpdating}>
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as Shipped
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bulk Ship Orders</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="carrier">Carrier *</Label>
                          <Select
                            value={shippingData.carrier}
                            onValueChange={(value) => 
                              setShippingData(prev => ({ ...prev, carrier: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FedEx">FedEx</SelectItem>
                              <SelectItem value="UPS">UPS</SelectItem>
                              <SelectItem value="DHL">DHL</SelectItem>
                              <SelectItem value="USPS">USPS</SelectItem>
                              <SelectItem value="Local Delivery">Local Delivery</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tracking">Tracking Number (Optional)</Label>
                          <Input
                            id="tracking"
                            value={shippingData.trackingNumber}
                            onChange={(e) => 
                              setShippingData(prev => ({ ...prev, trackingNumber: e.target.value }))
                            }
                            placeholder="Enter tracking number"
                          />
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={shippingData.notes}
                            onChange={(e) => 
                              setShippingData(prev => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="Additional shipping notes"
                            rows={3}
                          />
                        </div>

                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium mb-2">
                            Orders to be shipped: {selectedOrders.length}
                          </p>
                          <div className="space-y-1">
                            {selectedOrdersData.slice(0, 3).map(order => (
                              <p key={order.id} className="text-xs text-muted-foreground">
                                #{order.id.slice(-8)} - {formatPrice(order.total_amount)}
                              </p>
                            ))}
                            {selectedOrdersData.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{selectedOrdersData.length - 3} more orders
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={handleBulkShipping}
                            disabled={!shippingData.carrier || isUpdating}
                            className="flex-1"
                          >
                            Ship Orders
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowBulkShipping(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {canMarkDelivered && (
                  <Button
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('delivered')}
                    disabled={isUpdating}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('cancelled')}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Orders
                </Button>
              </>
            )}

            {/* Print/Generate Labels */}
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Reports
            </Button>
          </div>

          {selectedOrders.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p>Selected orders:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedOrdersData.slice(0, 5).map(order => (
                  <span key={order.id} className="bg-muted px-2 py-1 rounded">
                    #{order.id.slice(-8)}
                  </span>
                ))}
                {selectedOrdersData.length > 5 && (
                  <span className="bg-muted px-2 py-1 rounded">
                    +{selectedOrdersData.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};