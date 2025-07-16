import React from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShoppingCart } from '@/hooks/useShoppingCart';
import { useAuth } from '@/hooks/useAuth';

interface AddToCartButtonProps {
  adId: string;
  quantity?: number;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  adId,
  quantity = 1,
  variant = "default",
  size = "default",
  className
}) => {
  const { addToCart, loading } = useShoppingCart();
  const { user } = useAuth();

  const handleAddToCart = () => {
    addToCart(adId, quantity);
  };

  if (!user) {
    return null; // Don't show the button if user is not logged in
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
};