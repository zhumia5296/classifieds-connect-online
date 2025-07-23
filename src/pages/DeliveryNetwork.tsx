import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  Star,
  Navigation
} from 'lucide-react';
import { useDeliveryNetwork } from '@/hooks/useDeliveryNetwork';
import { DeliveryRequestForm } from '@/components/delivery/DeliveryRequestForm';
import { formatDistanceToNow } from 'date-fns';

export default function DeliveryNetwork() {
  const { deliveryRequests, loading } = useDeliveryNetwork();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'en_route_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showCreateForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Request Delivery</h1>
          <p className="text-muted-foreground">
            Create a new delivery request and get quotes from local providers
          </p>
        </div>
        
        <DeliveryRequestForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Local Delivery Network</h1>
          <p className="text-muted-foreground">
            Connect with local delivery services and track your packages in real-time
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Request Delivery
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{deliveryRequests.length}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => r.status === 'delivered').length}
                </p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Navigation className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => 
                    ['en_route_pickup', 'picked_up', 'en_route_delivery'].includes(r.status)
                  ).length}
                </p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">My Delivery Requests</TabsTrigger>
          <TabsTrigger value="providers">Find Providers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : deliveryRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No delivery requests yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by creating your first delivery request
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {deliveryRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{request.package_description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 mt-1 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">Pickup</p>
                          <p className="text-sm text-muted-foreground">{request.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 mt-1 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Delivery</p>
                          <p className="text-sm text-muted-foreground">{request.delivery_address}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {request.delivery_type && (
                          <span className="capitalize">{request.delivery_type} delivery</span>
                        )}
                        {request.final_cost && (
                          <span>${request.final_cost}</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Find Local Delivery Providers</h3>
              <p className="text-muted-foreground mb-4">
                Browse and connect with delivery services in your area
              </p>
              <Button variant="outline">
                Browse Providers
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}