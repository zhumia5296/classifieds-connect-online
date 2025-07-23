import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  Timer,
  AlertCircle
} from 'lucide-react';
import { SafetyCheckin, useSafetyCheckins } from '@/hooks/useSafetyCheckins';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SafetyCheckinCardProps {
  checkin: SafetyCheckin;
  onStatusUpdate?: () => void;
}

const SafetyCheckinCard: React.FC<SafetyCheckinCardProps> = ({ 
  checkin, 
  onStatusUpdate 
}) => {
  const { updateCheckinStatus, loading } = useSafetyCheckins();

  const getStatusIcon = (status: SafetyCheckin['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'started':
        return <Timer className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'emergency':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: SafetyCheckin['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'started':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusUpdate = async (status: SafetyCheckin['status']) => {
    try {
      let message = '';
      switch (status) {
        case 'started':
          message = 'Meeting started - I have arrived safely';
          break;
        case 'completed':
          message = 'Meeting completed successfully - I am safe';
          break;
        case 'emergency':
          message = 'EMERGENCY: I need immediate assistance';
          break;
      }

      await updateCheckinStatus(checkin.id, status, message);
      onStatusUpdate?.();
    } catch (error) {
      console.error('Error updating check-in status:', error);
    }
  };

  const isUpcoming = new Date(checkin.scheduled_time) > new Date();
  const isOverdue = checkin.status === 'overdue' || 
    (checkin.expected_return_time && new Date(checkin.expected_return_time) < new Date() && checkin.status !== 'completed');

  const canStart = checkin.status === 'scheduled' && isUpcoming;
  const canComplete = checkin.status === 'started';
  const canEmergency = checkin.status === 'scheduled' || checkin.status === 'started';

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isOverdue && "border-orange-300 bg-orange-50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            Safety Check-in
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("font-medium", getStatusColor(checkin.status))}
          >
            {getStatusIcon(checkin.status)}
            <span className="ml-1 capitalize">{checkin.status}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location & Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{checkin.meetup_location}</span>
          </div>
          
          {checkin.meetup_address && (
            <div className="ml-6 text-sm text-muted-foreground">
              {checkin.meetup_address}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(checkin.scheduled_time), 'MMM dd, yyyy h:mm a')}
              <span className="ml-2 text-muted-foreground">
                ({formatDistanceToNow(new Date(checkin.scheduled_time), { addSuffix: true })})
              </span>
            </span>
          </div>

          {checkin.expected_return_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>
                Expected return: {format(new Date(checkin.expected_return_time), 'h:mm a')}
              </span>
            </div>
          )}
        </div>

        {/* Contact Person */}
        {(checkin.contact_person_name || checkin.contact_person_phone) && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              Meeting with: {checkin.contact_person_name}
              {checkin.contact_person_phone && (
                <span className="ml-2 text-muted-foreground">
                  {checkin.contact_person_phone}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Emergency Contacts Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>
            {checkin.emergency_contacts.length} emergency contact{checkin.emergency_contacts.length !== 1 ? 's' : ''} notified
          </span>
        </div>

        {/* Notes */}
        {checkin.notes && (
          <div className="text-sm">
            <span className="font-medium">Notes: </span>
            <span className="text-muted-foreground">{checkin.notes}</span>
          </div>
        )}

        {/* Last Check-in */}
        {checkin.last_checkin_time && (
          <div className="text-sm text-muted-foreground">
            Last update: {format(new Date(checkin.last_checkin_time), 'MMM dd, h:mm a')}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canStart && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate('started')}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              I've Arrived
            </Button>
          )}

          {canComplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate('completed')}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Meeting Complete
            </Button>
          )}

          {canEmergency && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusUpdate('emergency')}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <AlertTriangle className="h-4 w-4" />
              Emergency
            </Button>
          )}

          {checkin.contact_person_phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`tel:${checkin.contact_person_phone}`, '_self')}
              className="flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}
        </div>

        {/* Overdue Warning */}
        {isOverdue && checkin.status !== 'completed' && (
          <div className="mt-4 p-3 rounded-lg bg-orange-100 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Check-in Overdue</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              This check-in is past its expected return time. Please update your status or contact emergency contacts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyCheckinCard;