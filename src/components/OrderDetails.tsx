import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOrders, Order } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  User,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrderById, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setLoading(true);
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, getOrderById]);

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'paid':
        return <CheckCircle className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <Package className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'paid':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    
    const success = await updateOrderStatus(order.id, newStatus);
    if (success) {
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    }
  };

  const isOwner = user?.id === order?.user_id;
  const isSeller = user?.id === order?.seller_id;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Order #{order.id.slice(-8)}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy at HH:mm')}
            </p>
          </div>
          <Badge variant={getStatusColor(order.status)} className="text-lg px-4 py-2">
            {getStatusIcon(order.status)}
            <span className="ml-2 capitalize">{order.status}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({order.order_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item) => {
                  const primaryImage = item.ad.ad_images?.find(img => img.is_primary)?.image_url ||
                                     item.ad.ad_images?.[0]?.image_url;

                  return (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                      {primaryImage && (
                        <img
                          src={primaryImage}
                          alt={item.ad.title}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold">{item.ad.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.ad.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Quantity: {item.quantity}</span>
                          <span>Unit Price: {formatPrice(item.unit_price, order.currency)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatPrice(item.total_price, order.currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Actions for Seller */}
            {isSeller && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.status === 'paid' && (
                    <Button 
                      onClick={() => handleStatusUpdate('shipped')}
                      className="w-full"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Mark as Shipped
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button 
                      onClick={() => handleStatusUpdate('delivered')}
                      className="w-full"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  )}
                  {['pending', 'paid'].includes(order.status) && (
                    <Button 
                      variant="destructive"
                      onClick={() => handleStatusUpdate('cancelled')}
                      className="w-full"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.total_amount, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>Included</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(order.total_amount, order.currency)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Ordered: {format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  {order.stripe_session_id && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment ID: {order.stripe_session_id.slice(-8)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isSeller ? 'Buyer' : 'Seller'} Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>User ID: {isSeller ? order.user_id.slice(-8) : order.seller_id.slice(-8)}</span>
                </div>
                <p className="text-muted-foreground">
                  Contact information can be accessed through the messaging system for privacy.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};