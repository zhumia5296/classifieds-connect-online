import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  AlertTriangle,
  TrendingUp,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Crown,
  UserCheck,
  Flag
} from "lucide-react";

interface AdminStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  featured_ads: number;
  total_messages: number;
  total_reports: number;
  pending_reports: number;
  ads_today: number;
  users_today: number;
}

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  role?: string;
}

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  location: string;
  is_active: boolean;
  is_featured: boolean;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
  } | null;
}

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  ad_id: string;
  ads: {
    title: string;
    user_id: string;
  } | null;
  profiles: {
    display_name: string | null;
  } | null;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, adminLoading]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) throw statsError;
      setStats(statsData as unknown as AdminStats);

      // Fetch users with roles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          location,
          is_verified,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (usersError) throw usersError;
      
      // Fetch roles separately
      const userIds = usersData?.map(u => u.user_id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);
      
      const usersWithRoles = usersData?.map(user => ({
        ...user,
        role: rolesData?.find(r => r.user_id === user.user_id)?.role || 'user'
      })) || [];
      setUsers(usersWithRoles);

      // Fetch ads
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          price,
          currency,
          location,
          is_active,
          is_featured,
          status,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (adsError) throw adsError;
      
      // Fetch profile names for ads
      const adUserIds = [...new Set(adsData?.map(a => a.user_id) || [])];
      const { data: adProfilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', adUserIds);
      
      const adsWithProfiles = adsData?.map(ad => ({
        ...ad,
        profiles: adProfilesData?.find(p => p.user_id === ad.user_id) || null
      })) || [];
      setAds(adsWithProfiles);

      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          description,
          status,
          created_at,
          reporter_id,
          ad_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reportsError) throw reportsError;
      
      // Fetch related data for reports
      const reportAdIds = reportsData?.map(r => r.ad_id) || [];
      const reportUserIds = reportsData?.map(r => r.reporter_id) || [];
      
      const { data: reportAdsData } = await supabase
        .from('ads')
        .select('id, title, user_id')
        .in('id', reportAdIds);
        
      const { data: reportProfilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', reportUserIds);
      
      const reportsWithRelations = reportsData?.map(report => ({
        ...report,
        ads: reportAdsData?.find(a => a.id === report.ad_id) || null,
        profiles: reportProfilesData?.find(p => p.user_id === report.reporter_id) || null
      })) || [];
      setReports(reportsWithRelations);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole as 'admin' | 'moderator' | 'user',
          assigned_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}.`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive"
      });
    }
  };

  const handleAdStatusChange = async (adId: string, action: 'activate' | 'deactivate' | 'feature' | 'unfeature') => {
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'activate':
          updateData = { is_active: true, status: 'active' };
          break;
        case 'deactivate':
          updateData = { is_active: false, status: 'inactive' };
          break;
        case 'feature':
          updateData = { is_featured: true };
          break;
        case 'unfeature':
          updateData = { is_featured: false };
          break;
      }

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Ad Updated",
        description: `Ad ${action}d successfully.`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating ad:', error);
      toast({
        title: "Error",
        description: "Failed to update ad.",
        variant: "destructive"
      });
    }
  };

  const handleReportAction = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'resolved' : 'rejected';
      
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report Updated",
        description: `Report ${action}d successfully.`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report.",
        variant: "destructive"
      });
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Manage users, ads, and reports</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Crown className="h-3 w-3 mr-1" />
            Administrator
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.users_today || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_ads || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.ads_today || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_ads || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.featured_ads || 0} featured
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pending_reports || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.total_reports || 0} total
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {user.display_name || 'Unnamed User'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.location || 'Not specified'}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleUserRoleChange(user.user_id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.is_verified ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ad Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">{ad.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {ad.location}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ad.profiles?.display_name || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          {ad.price ? `${ad.currency === 'USD' ? '$' : ad.currency}${ad.price}` : 'Contact for price'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant={ad.is_active ? "secondary" : "outline"}>
                              {ad.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {ad.is_featured && (
                              <Badge variant="default" className="bg-yellow-500">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(ad.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAdStatusChange(ad.id, ad.is_active ? 'deactivate' : 'activate')}
                            >
                              {ad.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAdStatusChange(ad.id, ad.is_featured ? 'unfeature' : 'feature')}
                            >
                              {ad.is_featured ? <XCircle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Ad</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {report.profiles?.display_name || 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          {report.ads?.title || 'Deleted Ad'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{report.reason}</div>
                            {report.description && (
                              <div className="text-sm text-muted-foreground">
                                {report.description.slice(0, 50)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            report.status === 'pending' ? 'outline' :
                            report.status === 'resolved' ? 'secondary' : 'destructive'
                          }>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {report.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReportAction(report.id, 'reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;