import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processOrder = async () => {
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Invalid session ID",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('process-order', {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        setOrderDetails(data.order);
        toast({
          title: "Order processed successfully!",
          description: "Your order has been confirmed and the seller has been notified.",
        });
      } catch (error) {
        console.error('Error processing order:', error);
        toast({
          title: "Processing error",
          description: "There was an issue processing your order. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };

    processOrder();
  }, [sessionId, navigate, toast]);

  if (processing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <h2 className="text-xl font-semibold">Processing your order...</h2>
                <p className="text-muted-foreground text-center">
                  Please wait while we confirm your payment and update inventory.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for your purchase. Your order has been successfully processed.
              </CardDescription>
            </CardHeader>
            
            {orderDetails && (
              <CardContent className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono">{orderDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">
                        ${orderDetails.total_amount.toFixed(2)} {orderDetails.currency?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{orderDetails.order_items?.length || 0} item(s)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">What's Next?</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        The seller has been notified of your order and will contact you soon to arrange delivery or pickup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => navigate('/dashboard')} className="flex-1">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    View My Orders
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}