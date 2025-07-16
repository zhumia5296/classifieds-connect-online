import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  ad_id: string;
  quantity: number;
  ad: {
    id: string;
    title: string;
    price: number;
    currency: string;
    user_id: string;
    quantity_available: number;
    max_quantity_per_order: number;
    images?: { image_url: string }[];
  };
}

export interface CartBySeller {
  seller_id: string;
  seller_name: string;
  items: CartItem[];
  total: number;
}

export const useShoppingCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCartItems = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select(`
          *,
          ad:ads!inner(
            id,
            title,
            price,
            currency,
            user_id,
            quantity_available,
            max_quantity_per_order,
            images:ad_images(image_url)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (adId: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.ad_id === adId);
      
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        const maxAllowed = Math.min(existingItem.ad.quantity_available, existingItem.ad.max_quantity_per_order);
        
        if (newQuantity > maxAllowed) {
          toast({
            title: "Quantity limit reached",
            description: `Maximum ${maxAllowed} items allowed`,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('shopping_cart')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            ad_id: adId,
            quantity: quantity
          });

        if (error) throw error;
      }

      await fetchCartItems();
      toast({
        title: "Added to cart",
        description: "Item successfully added to your cart",
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems();
      toast({
        title: "Removed from cart",
        description: "Item removed from your cart",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  };

  const getCartBySeller = (): CartBySeller[] => {
    const groupedBySeller = cartItems.reduce((acc, item) => {
      const sellerId = item.ad.user_id;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller_id: sellerId,
          seller_name: `Seller ${sellerId.slice(0, 8)}`, // TODO: Get actual seller name
          items: [],
          total: 0
        };
      }
      
      acc[sellerId].items.push(item);
      acc[sellerId].total += item.ad.price * item.quantity;
      
      return acc;
    }, {} as Record<string, CartBySeller>);

    return Object.values(groupedBySeller);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.ad.price * item.quantity), 0);
  };

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartBySeller,
    getTotalItems,
    getTotalPrice,
    fetchCartItems
  };
};