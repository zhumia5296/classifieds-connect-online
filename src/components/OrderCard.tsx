import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Order } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderCardProps {
  order: Order;
  viewType: 'buyer' | 'seller';
  onStatusUpdate?: (orderId: string, status: string) => Promise<boolean>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'paid':
      return <CheckCircle className="h-4 w-4" />;
    case 'shipped':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
      return <Package className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
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

export const OrderCard: React.FC<OrderCardProps> = ({ order, viewType, onStatusUpdate }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleViewDetails = () => {
    navigate(`/orders/${order.id}`);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusUpdate) {
      const success = await onStatusUpdate(order.id, newStatus);
      if (success) {
        // Optionally refresh the page or update local state
        window.location.reload();
      }
    }
  };

  const primaryImage = order.order_items[0]?.ad?.ad_images?.find(img => img.is_primary)?.image_url ||
                      order.order_items[0]?.ad?.ad_images?.[0]?.image_url;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
              <Badge variant={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'MMM dd, yyyy - HH:mm')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {formatPrice(order.total_amount, order.currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Order Items Preview */}
        <div className="space-y-2">
          {order.order_items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
              {primaryImage && (
                <img
                  src={primaryImage}
                  alt={item.ad.title}
                  className="w-12 h-12 object-cover rounded-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.ad.title}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">
                  {formatPrice(item.total_price, order.currency)}
                </p>
              </div>
            </div>
          ))}
          
          {order.order_items.length > 2 && (
            <p className="text-sm text-muted-foreground text-center">
              +{order.order_items.length - 2} more item{order.order_items.length - 2 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDetails}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
        
        {viewType === 'seller' && order.status === 'paid' && (
          <Button
            size="sm"
            onClick={() => handleStatusChange('shipped')}
            className="flex-1"
          >
            <Truck className="h-4 w-4 mr-1" />
            Mark Shipped
          </Button>
        )}
        
        {viewType === 'seller' && order.status === 'shipped' && (
          <Button
            size="sm"
            onClick={() => handleStatusChange('delivered')}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-1" />
            Mark Delivered
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};