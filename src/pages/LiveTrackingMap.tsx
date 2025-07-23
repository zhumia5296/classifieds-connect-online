import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MapPin, 
  Truck, 
  Package,
  Users,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InteractiveTrackingMap } from '@/components/InteractiveTrackingMap';
import { useDeliveryNetwork } from '@/hooks/useDeliveryNetwork';

export default function LiveTrackingMap() {
  const navigate = useNavigate();
  const { deliveryRequests } = useDeliveryNetwork();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('');
  const [showAllProviders, setShowAllProviders] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeliveries = deliveryRequests.filter(delivery => {
    const matchesSearch = delivery.package_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.delivery_address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const activeDeliveries = deliveryRequests.filter(d => 
    ['accepted', 'pickup_scheduled', 'en_route_pickup', 'at_pickup', 'picked_up', 'en_route_delivery', 'at_delivery'].includes(d.status)
  );

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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/delivery-network')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Live Delivery Tracking</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring of all delivery activities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllProviders(!showAllProviders)}
              >
                <Users className="h-4 w-4 mr-2" />
                {showAllProviders ? 'Hide' : 'Show'} Providers
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deliveries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="en_route_pickup">En Route to Pickup</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="en_route_delivery">En Route to Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">{deliveryRequests.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">{activeDeliveries.length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Delivery List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Active Deliveries</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDeliveryId('')}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              
              {filteredDeliveries.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No deliveries found
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredDeliveries.map((delivery) => (
                    <Card 
                      key={delivery.id}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedDeliveryId === delivery.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedDeliveryId(
                        selectedDeliveryId === delivery.id ? '' : delivery.id
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">
                            {delivery.package_description}
                          </p>
                          <Badge 
                            className={`${getStatusColor(delivery.status)} text-xs`}
                          >
                            {delivery.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="truncate">{delivery.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span className="truncate">{delivery.delivery_address}</span>
                        </div>
                      </div>
                      
                      {delivery.final_cost && (
                        <div className="mt-2 text-xs font-medium">
                          ${delivery.final_cost}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <InteractiveTrackingMap
            deliveryRequestId={selectedDeliveryId || undefined}
            showAllProviders={showAllProviders}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}