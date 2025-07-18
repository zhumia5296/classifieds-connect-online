import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Order } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { 
  Clock, 
  CreditCard, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Calendar
} from 'lucide-react';

interface OrderStatusFlowProps {
  order: Order;
  onStatusUpdate?: (orderId: string, status: string) => Promise<boolean>;
  userType: 'buyer' | 'seller';
}

const statusSteps = [
  {
    key: 'pending',
    label: 'Order Placed',
    description: 'Order has been placed and is pending payment',
    icon: Clock,
    color: 'text-orange-500'
  },
  {
    key: 'paid',
    label: 'Payment Confirmed',
    description: 'Payment has been processed successfully',
    icon: CreditCard,
    color: 'text-blue-500'
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'Order has been shipped and is in transit',
    icon: Truck,
    color: 'text-purple-500'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Order has been delivered successfully',
    icon: CheckCircle,
    color: 'text-green-500'
  }
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled') return -1;
  return statusSteps.findIndex(step => step.key === status);
};

const getProgressPercentage = (status: string) => {
  if (status === 'cancelled') return 0;
  const index = getStatusIndex(status);
  return ((index + 1) / statusSteps.length) * 100;
};

export const OrderStatusFlow: React.FC<OrderStatusFlowProps> = ({
  order,
  onStatusUpdate,
  userType
}) => {
  const currentStatusIndex = getStatusIndex(order.status);
  const progressPercentage = getProgressPercentage(order.status);
  const isCancelled = order.status === 'cancelled';

  const handleStatusUpdate = async (newStatus: string) => {
    if (onStatusUpdate) {
      await onStatusUpdate(order.id, newStatus);
    }
  };

  const getNextAction = () => {
    if (userType !== 'seller') return null;
    
    switch (order.status) {
      case 'paid':
        return {
          label: 'Mark as Shipped',
          action: () => handleStatusUpdate('shipped'),
          icon: Truck
        };
      case 'shipped':
        return {
          label: 'Mark as Delivered',
          action: () => handleStatusUpdate('delivered'),
          icon: CheckCircle
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Status</span>
          {isCancelled ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Cancelled
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <span className="capitalize">{order.status}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isCancelled && (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Status Steps */}
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const IconComponent = step.icon;

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2 
                      ${isCompleted 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground text-muted-foreground'
                      }
                    `}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </h4>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {/* Show timestamp if available */}
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {step.key === 'pending' && format(new Date(order.created_at), 'MMM dd, HH:mm')}
                            {step.key === 'shipped' && order.tracking_number && 'Shipped'}
                            {step.key === 'delivered' && order.actual_delivery_date && 
                              format(new Date(order.actual_delivery_date), 'MMM dd, HH:mm')
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {index < statusSteps.length - 1 && (
                      <div className={`
                        w-px h-8 ml-4 
                        ${isCompleted ? 'bg-primary' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Cancelled State */}
        {isCancelled && (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="font-semibold mb-2">Order Cancelled</h3>
            <p className="text-sm text-muted-foreground">
              This order was cancelled on {format(new Date(order.updated_at), 'MMMM dd, yyyy')}
            </p>
          </div>
        )}

        {/* Action Buttons for Sellers */}
        {userType === 'seller' && !isCancelled && nextAction && (
          <div className="border-t pt-4">
            <Button
              onClick={nextAction.action}
              className="w-full flex items-center gap-2"
            >
              <nextAction.icon className="h-4 w-4" />
              {nextAction.label}
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        )}

        {/* Additional Information */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID:</span>
            <span className="font-mono">#{order.id.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Placed:</span>
            <span>{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          {order.tracking_number && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking:</span>
              <span className="font-mono">{order.tracking_number}</span>
            </div>
          )}
          {order.estimated_delivery_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Delivery:</span>
              <span>{format(new Date(order.estimated_delivery_date), 'MMM dd, yyyy')}</span>
            </div>
          )}
          {order.carrier && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carrier:</span>
              <span>{order.carrier}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};