import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  PlusCircle, 
  Heart, 
  Settings, 
  MessageSquare,
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const mockAds = [
    {
      id: 1,
      title: "iPhone 14 Pro - Excellent Condition",
      price: "$899",
      status: "active",
      views: 127,
      messages: 8,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "2019 Honda Civic - Low Miles",
      price: "$18,500",
      status: "pending",
      views: 89,
      messages: 3,
      createdAt: "2024-01-12"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pending: "secondary",
      sold: "outline"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Manage your ads and account settings from your dashboard.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="my-ads" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">My Ads</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    +1 from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">216</div>
                  <p className="text-xs text-muted-foreground">
                    +15% from last week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">11</div>
                  <p className="text-xs text-muted-foreground">
                    3 unread messages
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saved Ads</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-muted-foreground">
                    Watching for updates
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks to manage your listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Button className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Post New Ad
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      View Messages
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="my-ads">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Advertisements</h2>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Post New Ad
                </Button>
              </div>
              
              <div className="grid gap-4">
                {mockAds.map((ad) => (
                  <Card key={ad.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{ad.title}</h3>
                            {getStatusBadge(ad.status)}
                          </div>
                          <p className="text-lg font-bold text-primary mb-2">{ad.price}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {ad.views} views
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {ad.messages} messages
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {ad.createdAt}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">View</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Advertisements</CardTitle>
                <CardDescription>
                  Ads you've saved for later viewing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No saved ads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start browsing ads and save the ones you're interested in
                  </p>
                  <Button>Browse Ads</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.email}</h3>
                    <p className="text-sm text-muted-foreground">Member since January 2024</p>
                  </div>
                </div>
                
                <div className="grid gap-4 pt-4">
                  <Button variant="outline" className="justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile Information
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Preferences
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;