import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RealtimeStatusProps {
  showDetails?: boolean;
}

const RealtimeStatus = ({ showDetails = false }: RealtimeStatusProps) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('DISCONNECTED');

  useEffect(() => {
    if (!user) return;

    // Create a test channel to monitor connection status
    const statusChannel = supabase
      .channel('connection-status')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        setConnectionStatus('CONNECTED');
      })
      .subscribe((status) => {
        setConnectionStatus(status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [user]);

  if (!showDetails) {
    return (
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={`flex items-center gap-1 ${
          isConnected ? 'bg-green-100 text-green-800' : ''
        }`}
      >
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? 'Live' : 'Offline'}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <Wifi className="h-4 w-4" />
          <span className="font-medium">Real-time Connected</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">Disconnected</span>
        </div>
      )}
      <Badge variant="outline" className="text-xs">
        {connectionStatus}
      </Badge>
    </div>
  );
};

export default RealtimeStatus;