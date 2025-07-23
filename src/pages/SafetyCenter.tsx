import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  MapPin,
  Plus,
  History
} from 'lucide-react';
import { useSafetyCheckins } from '@/hooks/useSafetyCheckins';
import SafetyCheckinModal from '@/components/SafetyCheckinModal';
import SafetyCheckinCard from '@/components/SafetyCheckinCard';
import TrustedContactsManager from '@/components/TrustedContactsManager';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SafetyCenter: React.FC = () => {
  const { checkins, trustedContacts, loading } = useSafetyCheckins();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCheckinCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleStatusUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Separate active and completed check-ins
  const activeCheckins = checkins.filter(c => 
    c.status === 'scheduled' || c.status === 'started' || c.status === 'overdue' || c.status === 'emergency'
  );
  const completedCheckins = checkins.filter(c => c.status === 'completed');

  // Count by status
  const statusCounts = {
    scheduled: checkins.filter(c => c.status === 'scheduled').length,
    active: checkins.filter(c => c.status === 'started').length,
    overdue: checkins.filter(c => c.status === 'overdue').length,
    emergency: checkins.filter(c => c.status === 'emergency').length,
    completed: completedCheckins.length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
            <p>Loading safety center...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Safety Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your safety check-ins and emergency contacts for secure meetups
            </p>
          </div>
          <SafetyCheckinModal onCheckinCreated={handleCheckinCreated} />
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{statusCounts.scheduled}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{statusCounts.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{statusCounts.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold">{statusCounts.emergency}</div>
              <div className="text-sm text-muted-foreground">Emergency</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{statusCounts.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts Warning */}
        {trustedContacts.length === 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <strong>No emergency contacts found.</strong> Add trusted contacts in the "Emergency Contacts" tab 
              to enable safety check-in notifications.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Active Check-ins
            {activeCheckins.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeCheckins.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Emergency Contacts
            {trustedContacts.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {trustedContacts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Check-ins */}
        <TabsContent value="active" className="space-y-6">
          {activeCheckins.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No active safety check-ins</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create a safety check-in before meeting someone to share your location and status with trusted contacts.
                  </p>
                  <SafetyCheckinModal 
                    onCheckinCreated={handleCheckinCreated}
                    trigger={
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create First Check-in
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeCheckins.map((checkin) => (
                <SafetyCheckinCard 
                  key={`${checkin.id}-${refreshKey}`} 
                  checkin={checkin} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-6">
          {completedCheckins.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">No completed check-ins</h3>
                  <p className="text-muted-foreground">
                    Your completed safety check-ins will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedCheckins.map((checkin) => (
                <SafetyCheckinCard 
                  key={`${checkin.id}-history-${refreshKey}`} 
                  checkin={checkin} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Emergency Contacts */}
        <TabsContent value="contacts">
          <TrustedContactsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafetyCenter;