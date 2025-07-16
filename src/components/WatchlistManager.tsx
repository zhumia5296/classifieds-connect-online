import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bell, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  Search, 
  MapPin, 
  DollarSign, 
  Tag,
  Clock
} from "lucide-react";
import { useWatchlists, type Watchlist, type WatchlistNotification } from '@/hooks/useWatchlists';
import WatchlistForm from './WatchlistForm';
import { formatDistanceToNow } from 'date-fns';

const WatchlistManager = () => {
  const { 
    watchlists, 
    notifications, 
    loading, 
    updateWatchlist, 
    deleteWatchlist, 
    markNotificationAsRead,
    getUnreadNotificationCount 
  } = useWatchlists();
  
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleToggleActive = async (watchlist: Watchlist) => {
    await updateWatchlist(watchlist.id, { is_active: !watchlist.is_active });
  };

  const handleDelete = async (watchlistId: string) => {
    if (confirm('Are you sure you want to delete this watchlist?')) {
      await deleteWatchlist(watchlistId);
    }
  };

  const formatCriteria = (criteria: Watchlist['criteria']) => {
    const parts: string[] = [];
    
    if (criteria.keywords) parts.push(`Keywords: "${criteria.keywords}"`);
    if (criteria.min_price || criteria.max_price) {
      const priceRange = [
        criteria.min_price ? `$${criteria.min_price}` : '',
        criteria.max_price ? `$${criteria.max_price}` : ''
      ].filter(Boolean).join(' - ');
      parts.push(`Price: ${priceRange || 'Any'}`);
    }
    if (criteria.location) parts.push(`Location: ${criteria.location}`);
    
    return parts.length > 0 ? parts.join(' • ') : 'No specific criteria';
  };

  const WatchlistCard = ({ watchlist }: { watchlist: Watchlist }) => (
    <Card className={`${!watchlist.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{watchlist.name}</CardTitle>
            <CardDescription className="mt-1">
              {formatCriteria(watchlist.criteria)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={watchlist.is_active}
              onCheckedChange={() => handleToggleActive(watchlist)}
              disabled={loading}
            />
            <Badge variant={watchlist.is_active ? "default" : "secondary"}>
              {watchlist.is_active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Created {formatDistanceToNow(new Date(watchlist.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingWatchlist(watchlist)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Edit Watchlist</DialogTitle>
                </DialogHeader>
                <WatchlistForm
                  watchlist={editingWatchlist || undefined}
                  onSuccess={() => setEditingWatchlist(null)}
                  onCancel={() => setEditingWatchlist(null)}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(watchlist.id)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NotificationCard = ({ notification }: { notification: WatchlistNotification }) => (
    <Card className={`${notification.is_read ? 'opacity-60' : 'border-primary'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-medium">{notification.watchlist?.name}</span>
              {!notification.is_read && <Badge variant="default" className="text-xs">New</Badge>}
            </div>
            <div className="space-y-1">
              <p className="font-medium">{notification.ad?.title}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {notification.ad?.price && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {notification.ad.currency} {notification.ad.price}
                  </span>
                )}
                {notification.ad?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {notification.ad.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            {!notification.is_read && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Watchlists</h2>
          <p className="text-muted-foreground">
            Get notified when ads matching your criteria are posted
          </p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Watchlist</DialogTitle>
            </DialogHeader>
            <WatchlistForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="watchlists" className="w-full">
        <TabsList>
          <TabsTrigger value="watchlists">
            My Watchlists ({watchlists.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Notifications
            {getUnreadNotificationCount() > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {getUnreadNotificationCount()}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlists" className="space-y-4">
          {watchlists.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No watchlists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first watchlist to get notified about matching ads
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Watchlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {watchlists.map((watchlist) => (
                <WatchlistCard key={watchlist.id} watchlist={watchlist} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  You'll see notifications here when ads matching your watchlists are posted
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WatchlistManager;