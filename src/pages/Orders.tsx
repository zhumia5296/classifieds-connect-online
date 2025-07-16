import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { OrderCard } from '@/components/OrderCard';
import { OrderFilters } from '@/components/OrderFilters';
import { 
  ShoppingBag, 
  Store, 
  TrendingUp, 
  Package, 
  RefreshCcw,
  AlertCircle 
} from 'lucide-react';

const Orders: React.FC = () => {
  const { orders, loading, fetchOrders, updateOrderStatus, getOrderStats } = useOrders();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [filters, setFilters] = useState({});
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchOrders(activeTab, filters);
      loadStats();
    }
  }, [user, activeTab, filters]);

  const loadStats = async () => {
    const statsData = await getOrderStats(activeTab);
    setStats(statsData);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleRefresh = () => {
    fetchOrders(activeTab, filters);
    loadStats();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please log in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">
              Manage your purchases and sales transactions
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Orders</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Total {activeTab === 'buyer' ? 'Spent' : 'Earned'}
                  </span>
                </div>
                <p className="text-2xl font-bold mt-2">{formatPrice(stats.totalSpent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.pendingOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats.paidOrders}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buyer' | 'seller')}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              My Purchases
            </TabsTrigger>
            <TabsTrigger value="seller" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              My Sales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer" className="space-y-6">
            <OrderFilters
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              currentFilters={filters}
            />

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    viewType="buyer"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    You haven't made any purchases yet. Start shopping to see your orders here.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="seller" className="space-y-6">
            <OrderFilters
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              currentFilters={filters}
            />

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    viewType="seller"
                    onStatusUpdate={updateOrderStatus}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No sales found</h3>
                  <p className="text-muted-foreground">
                    You haven't made any sales yet. List some items to start selling.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;