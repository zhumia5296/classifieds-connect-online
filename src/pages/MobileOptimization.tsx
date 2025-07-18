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
  Zap,
  Hand,
  Vibrate,
  Share,
  Clipboard,
  Battery,
  Cpu
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useEnhancedMobile } from '@/hooks/useEnhancedMobile';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';

const MobileOptimization = () => {
  const { isInstallable, isInstalled, installApp, requestNotificationPermission } = usePWA();
  const { 
    deviceInfo, 
    networkInfo, 
    performanceMetrics, 
    triggerHapticFeedback,
    shareContent,
    copyToClipboard,
    wakeLockActive,
    requestWakeLock,
    releaseWakeLock,
    shouldUseReducedData,
    getOptimalImageQuality
  } = useEnhancedMobile();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate refresh action
      await new Promise(resolve => setTimeout(resolve, 1500));
      triggerHapticFeedback('light');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShare = async () => {
    const shared = await shareContent({
      title: 'Classifieds Connect',
      text: 'Check out this awesome mobile-optimized classifieds app!',
      url: window.location.href
    });
    
    if (!shared) {
      // Fallback to clipboard
      const copied = await copyToClipboard(window.location.href);
      if (copied) {
        triggerHapticFeedback('light');
      }
    }
  };

  const enhancedFeatures = [
    {
      icon: Hand,
      title: 'Touch Gestures',
      description: 'Swipe, pinch, and tap for intuitive navigation',
      available: deviceInfo.hasTouch,
      status: deviceInfo.hasTouch ? 'Active' : 'Not Available'
    },
    {
      icon: Vibrate,
      title: 'Haptic Feedback',
      description: 'Physical feedback for touch interactions',
      available: 'vibrate' in navigator,
      status: 'vibrate' in navigator ? 'Active' : 'Not Available'
    },
    {
      icon: Share,
      title: 'Native Sharing',
      description: 'Share content using device native options',
      available: 'share' in navigator,
      status: 'share' in navigator ? 'Available' : 'Fallback Active'
    },
    {
      icon: Clipboard,
      title: 'Clipboard Access',
      description: 'Copy and paste functionality',
      available: 'clipboard' in navigator,
      status: 'clipboard' in navigator ? 'Active' : 'Fallback Active'
    },
    {
      icon: Battery,
      title: 'Battery Optimization',
      description: 'Adaptive performance based on battery level',
      available: deviceInfo.batteryLevel !== undefined,
      status: deviceInfo.batteryLevel !== undefined ? `${Math.round((deviceInfo.batteryLevel || 0) * 100)}%` : 'Not Available'
    },
    {
      icon: Cpu,
      title: 'Performance Monitoring',
      description: 'Real-time performance and memory tracking',
      available: true,
      status: `${performanceMetrics.connectionSpeed.toUpperCase()} connection`
    }
  ];

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
      available: 'serviceWorker' in navigator,
      status: networkInfo.online ? 'Online' : 'Offline Mode'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get notified about new messages and updates',
      available: 'Notification' in window,
      status: typeof Notification !== 'undefined' && Notification?.permission === 'granted' ? 'Enabled' : 'Available'
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
    <PullToRefresh onRefresh={handleRefresh} refreshing={isRefreshing}>
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
              <Badge variant={networkInfo.online ? 'default' : 'destructive'}>
                {networkInfo.online ? 'Online' : 'Offline'}
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

      {/* Enhanced Mobile Features */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Mobile Capabilities</CardTitle>
          <p className="text-sm text-muted-foreground">
            Advanced features for superior mobile experience
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {enhancedFeatures.map((feature, index) => (
              <SwipeableCard
                key={index}
                onTap={() => triggerHapticFeedback('light')}
                onSave={() => triggerHapticFeedback('medium')}
                onShare={handleShare}
                showActions={false}
              >
                <div className="flex items-center justify-between">
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
                    className={feature.status === 'Active' || feature.status.includes('%') ? 
                      'bg-green-100 text-green-800' : ''}
                  >
                    {feature.status}
                  </Badge>
                </div>
              </SwipeableCard>
            ))}
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
              <SwipeableCard
                key={index}
                onTap={() => triggerHapticFeedback('light')}
                showActions={false}
              >
                <div className="flex items-center justify-between">
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
                    className={feature.status === 'Enabled' || feature.status === 'Active' || feature.status === 'Installed' || feature.status === 'Online' ? 
                      'bg-green-100 text-green-800' : ''}
                  >
                    {feature.status}
                  </Badge>
                </div>
              </SwipeableCard>
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
        
        {(typeof Notification !== 'undefined' && Notification?.permission !== 'granted') && (
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

      {/* Advanced Controls */}
      <Card>
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Wake Lock</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Keep screen awake during important activities
          </p>
          <Button 
            onClick={wakeLockActive ? releaseWakeLock : requestWakeLock}
            variant={wakeLockActive ? "destructive" : "default"}
            className="w-full"
          >
            {wakeLockActive ? 'Release Wake Lock' : 'Request Wake Lock'}
          </Button>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{performanceMetrics.connectionSpeed}</div>
              <div className="text-sm text-muted-foreground">Connection</div>
            </div>
            
            {networkInfo.downlink && (
              <div className="text-center">
                <div className="text-lg font-semibold">{networkInfo.downlink.toFixed(1)} Mbps</div>
                <div className="text-sm text-muted-foreground">Downlink</div>
              </div>
            )}
            
            {performanceMetrics.deviceMemory && (
              <div className="text-center">
                <div className="text-lg font-semibold">{performanceMetrics.deviceMemory} GB</div>
                <div className="text-sm text-muted-foreground">Device Memory</div>
              </div>
            )}
            
            <div className="text-center">
              <Badge variant={shouldUseReducedData() ? 'destructive' : 'default'}>
                {shouldUseReducedData() ? 'Data Saver' : 'Normal'}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Data Mode</div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PullToRefresh>
  );
};

export default MobileOptimization;