import React from 'react';
import { ShoppingCart, Minus, Plus, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useShoppingCart, CartBySeller } from '@/hooks/useShoppingCart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShoppingCartProps {
  onCheckout?: (cartBySeller: CartBySeller) => void;
}

export const ShoppingCartComponent: React.FC<ShoppingCartProps> = ({ onCheckout }) => {
  const {
    cartItems,
    loading,
    updateQuantity,
    removeFromCart,
    getCartBySeller,
    getTotalItems,
    getTotalPrice
  } = useShoppingCart();
  
  const { toast } = useToast();
  const cartBySeller = getCartBySeller();

  const handleCheckout = async (sellerCart: CartBySeller) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: sellerCart.items.map(item => ({
            ad_id: item.ad_id,
            quantity: item.quantity,
            unit_price: item.ad.price
          })),
          seller_id: sellerCart.seller_id,
          total_amount: sellerCart.total
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Unable to process checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {getTotalItems() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : cartBySeller.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Your cart is empty
              </div>
            ) : (
              cartBySeller.map((sellerCart) => (
                <Card key={sellerCart.seller_id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {sellerCart.seller_name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {sellerCart.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0">
                          {item.ad.images?.[0] && (
                            <img
                              src={item.ad.images[0].image_url}
                              alt={item.ad.title}
                              className="w-full h-full object-cover rounded-md"
                            />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {item.ad.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.ad.price, item.ad.currency)}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="text-sm font-medium">
                              {item.quantity}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= Math.min(item.ad.quantity_available, item.ad.max_quantity_per_order)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-auto"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-medium">
                        {formatPrice(sellerCart.total)}
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleCheckout(sellerCart)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout ({sellerCart.items.length} items)
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {cartBySeller.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {cartBySeller.length} seller{cartBySeller.length !== 1 ? 's' : ''} • Separate checkouts required
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};