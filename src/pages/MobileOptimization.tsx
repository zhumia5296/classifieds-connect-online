import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Wifi, 
  Bell, 
  Camera,
  Globe,
  Zap
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const MobileOptimization = () => {
  const { isInstallable, isInstalled, installApp, requestNotificationPermission } = usePWA();
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    platform: '',
    online: navigator.onLine
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bMobile\b)/i.test(userAgent) && window.screen.width >= 768;
      
      setDeviceInfo({
        isMobile: isMobile && !isTablet,
        isTablet,
        isDesktop: !isMobile,
        platform: userAgent.includes('iPhone') ? 'iOS' : 
                 userAgent.includes('Android') ? 'Android' : 
                 userAgent.includes('Windows') ? 'Windows' : 'Other',
        online: navigator.onLine
      });
    };

    detectDevice();
    
    const handleOnline = () => setDeviceInfo(prev => ({ ...prev, online: true }));
    const handleOffline = () => setDeviceInfo(prev => ({ ...prev, online: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const mobileFeatures = [
    {
      icon: Download,
      title: 'Installable App',
      description: 'Install on your home screen for native app experience',
      available: isInstallable,
      status: isInstalled ? 'Installed' : isInstallable ? 'Available' : 'Not Available'
    },
    {
      icon: Wifi,
      title: 'Offline Support',
      description: 'Browse cached content when offline',
      available: true,
      status: 'Active'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get notified about new messages and updates',
      available: 'Notification' in window,
      status: Notification?.permission === 'granted' ? 'Enabled' : 'Available'
    },
    {
      icon: Camera,
      title: 'Camera Access',
      description: 'Take photos directly for your ads',
      available: 'mediaDevices' in navigator,
      status: 'Available'
    },
    {
      icon: Globe,
      title: 'Location Services',
      description: 'Auto-detect your location for local ads',
      available: 'geolocation' in navigator,
      status: 'Available'
    },
    {
      icon: Zap,
      title: 'Background Sync',
      description: 'Sync data when connection is restored',
      available: 'serviceWorker' in navigator,
      status: 'Active'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Smartphone className="h-8 w-8" />
          Mobile Optimization
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enhanced mobile experience with PWA features, offline support, and native capabilities
        </p>
      </div>

      {/* Device Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {deviceInfo.isMobile ? <Smartphone className="h-5 w-5" /> : 
             deviceInfo.isTablet ? <Monitor className="h-5 w-5" /> : 
             <Monitor className="h-5 w-5" />}
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {deviceInfo.isMobile ? 'Mobile' : 
                 deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
              </div>
              <div className="text-sm text-muted-foreground">Device Type</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">{deviceInfo.platform}</div>
              <div className="text-sm text-muted-foreground">Platform</div>
            </div>
            
            <div className="text-center">
              <Badge variant={deviceInfo.online ? 'default' : 'destructive'}>
                {deviceInfo.online ? 'Online' : 'Offline'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Connection</div>
            </div>
            
            <div className="text-center">
              <Badge variant={isInstalled ? 'default' : 'outline'}>
                {isInstalled ? 'Installed' : 'Web App'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">App Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle>Progressive Web App Features</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modern web capabilities for an app-like experience
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {mobileFeatures.map((feature, index) => (
              <div key={index}>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={feature.available ? 'default' : 'outline'}
                    className={feature.status === 'Enabled' || feature.status === 'Active' || feature.status === 'Installed' ? 
                      'bg-green-100 text-green-800' : ''}
                  >
                    {feature.status}
                  </Badge>
                </div>
                {index < mobileFeatures.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isInstallable && !isInstalled && (
          <Card>
            <CardContent className="p-6 text-center">
              <Download className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Install App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get faster loading and offline access by installing the app
              </p>
              <Button onClick={installApp} className="w-full">
                Install Now
              </Button>
            </CardContent>
          </Card>
        )}
        
        {Notification?.permission !== 'granted' && (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Enable Notifications</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Stay updated with new messages and important alerts
              </p>
              <Button onClick={requestNotificationPermission} variant="outline" className="w-full">
                Enable Notifications
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <div>
                <h4 className="font-medium">Add to Home Screen</h4>
                <p className="text-sm text-muted-foreground">
                  Install the app for quick access from your home screen
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <div>
                <h4 className="font-medium">Offline Browsing</h4>
                <p className="text-sm text-muted-foreground">
                  Previously viewed content is available even when offline
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
              <div>
                <h4 className="font-medium">Touch Gestures</h4>
                <p className="text-sm text-muted-foreground">
                  Swipe to navigate and use touch-friendly controls
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileOptimization;