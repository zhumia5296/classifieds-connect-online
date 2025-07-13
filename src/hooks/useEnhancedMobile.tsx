import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface NetworkInfo {
  online: boolean;
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: string;
  hasTouch: boolean;
  orientation: 'portrait' | 'landscape';
  standalone: boolean;
  batteryLevel?: number;
  charging?: boolean;
}

interface PerformanceMetrics {
  connectionSpeed: 'slow' | 'medium' | 'fast';
  memoryUsage?: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export const useEnhancedMobile = () => {
  const isMobile = useIsMobile();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    online: navigator.onLine
  });
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    platform: 'Unknown',
    hasTouch: false,
    orientation: 'portrait',
    standalone: false
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    connectionSpeed: 'medium'
  });

  // Update network information
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      setNetworkInfo({
        online: navigator.onLine,
        downlink: connection?.downlink,
        effectiveType: connection?.effectiveType,
        saveData: connection?.saveData
      });
    };

    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  // Update device information
  useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTabletDevice = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bMobile\b)/i.test(userAgent) && 
                            window.screen.width >= 768;
      
      const platform = userAgent.includes('iPhone') ? 'iOS' : 
                      userAgent.includes('iPad') ? 'iPadOS' :
                      userAgent.includes('Android') ? 'Android' : 
                      userAgent.includes('Windows') ? 'Windows' : 
                      userAgent.includes('Mac') ? 'macOS' : 'Other';

      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;

      setDeviceInfo({
        isMobile: isMobileDevice && !isTabletDevice,
        isTablet: isTabletDevice,
        isDesktop: !isMobileDevice,
        platform,
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
        standalone
      });
    };

    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100); // Delay to get accurate dimensions
    };

    updateDeviceInfo();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Update performance metrics
  useEffect(() => {
    const updatePerformanceMetrics = () => {
      const connection = (navigator as any).connection;
      let connectionSpeed: 'slow' | 'medium' | 'fast' = 'medium';

      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          connectionSpeed = 'slow';
        } else if (effectiveType === '3g') {
          connectionSpeed = 'medium';
        } else if (effectiveType === '4g') {
          connectionSpeed = 'fast';
        }
      }

      const performance = (window as any).performance;
      const memory = performance?.memory;

      setPerformanceMetrics({
        connectionSpeed,
        memoryUsage: memory?.usedJSHeapSize,
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency
      });
    };

    updatePerformanceMetrics();
    
    // Update performance metrics periodically
    const interval = setInterval(updatePerformanceMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Battery API
  useEffect(() => {
    const updateBatteryInfo = async () => {
      try {
        const battery = await (navigator as any).getBattery?.();
        if (battery) {
          const updateBattery = () => {
            setDeviceInfo(prev => ({
              ...prev,
              batteryLevel: battery.level,
              charging: battery.charging
            }));
          };

          updateBattery();
          battery.addEventListener('chargingchange', updateBattery);
          battery.addEventListener('levelchange', updateBattery);

          return () => {
            battery.removeEventListener('chargingchange', updateBattery);
            battery.removeEventListener('levelchange', updateBattery);
          };
        }
      } catch (error) {
        console.log('Battery API not supported:', error);
      }
    };

    updateBatteryInfo();
  }, []);

  // Haptic feedback
  const triggerHapticFeedback = useCallback((pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[pattern]);
    }
  }, []);

  // Screen wake lock
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLock, setWakeLock] = useState<any>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        setWakeLockActive(true);
        
        lock.addEventListener('release', () => {
          setWakeLockActive(false);
        });
        
        return lock;
      }
    } catch (error) {
      console.log('Wake lock request failed:', error);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      setWakeLockActive(false);
    }
  }, [wakeLock]);

  // Share API
  const shareContent = useCallback(async (shareData: {
    title?: string;
    text?: string;
    url?: string;
  }) => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch (error) {
        console.log('Share failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }, []);

  // Adaptive loading based on device capabilities
  const shouldUseReducedData = useCallback(() => {
    return (
      networkInfo.saveData ||
      performanceMetrics.connectionSpeed === 'slow' ||
      !networkInfo.online ||
      deviceInfo.batteryLevel !== undefined && deviceInfo.batteryLevel < 0.2
    );
  }, [networkInfo, performanceMetrics, deviceInfo]);

  // Adaptive image quality
  const getOptimalImageQuality = useCallback(() => {
    if (shouldUseReducedData()) return 'low';
    if (performanceMetrics.connectionSpeed === 'fast') return 'high';
    return 'medium';
  }, [shouldUseReducedData, performanceMetrics]);

  return {
    // Device information
    isMobile,
    deviceInfo,
    networkInfo,
    performanceMetrics,
    
    // Utility functions
    triggerHapticFeedback,
    shareContent,
    copyToClipboard,
    
    // Wake lock
    wakeLockActive,
    requestWakeLock,
    releaseWakeLock,
    
    // Adaptive features
    shouldUseReducedData,
    getOptimalImageQuality
  };
};