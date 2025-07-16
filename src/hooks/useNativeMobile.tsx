import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Toast } from '@capacitor/toast';

export const useNativeMobile = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  // Haptic feedback
  const hapticFeedback = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!isNative) return;
    
    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style];
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.log('Haptics not available:', error);
    }
  }, [isNative]);

  // Native sharing
  const nativeShare = useCallback(async (options: {
    title?: string;
    text?: string;
    url?: string;
    dialogTitle?: string;
  }) => {
    if (!isNative) {
      // Fallback to web share API
      if (navigator.share) {
        try {
          await navigator.share(options);
          return true;
        } catch (error) {
          console.log('Web share failed:', error);
          return false;
        }
      }
      return false;
    }

    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || 'Share'
      });
      return true;
    } catch (error) {
      console.log('Native share failed:', error);
      return false;
    }
  }, [isNative]);

  // Native toast
  const showToast = useCallback(async (message: string, duration: 'short' | 'long' = 'short') => {
    if (!isNative) return;
    
    try {
      await Toast.show({
        text: message,
        duration: duration,
        position: 'bottom'
      });
    } catch (error) {
      console.log('Toast not available:', error);
    }
  }, [isNative]);

  // Status bar control
  const setStatusBarStyle = useCallback(async (style: 'light' | 'dark' = 'dark') => {
    if (!isNative) return;
    
    try {
      await StatusBar.setStyle({ 
        style: style === 'light' ? Style.Light : Style.Dark 
      });
    } catch (error) {
      console.log('Status bar control not available:', error);
    }
  }, [isNative]);

  const hideStatusBar = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await StatusBar.hide();
    } catch (error) {
      console.log('Status bar control not available:', error);
    }
  }, [isNative]);

  const showStatusBar = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await StatusBar.show();
    } catch (error) {
      console.log('Status bar control not available:', error);
    }
  }, [isNative]);

  const setStatusBarColor = useCallback(async (color: string) => {
    if (!isNative) return;
    
    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.log('Status bar control not available:', error);
    }
  }, [isNative]);

  // App state detection
  const addAppStateListener = useCallback((callback: (isActive: boolean) => void) => {
    if (!isNative) return () => {};

    const handleVisibilityChange = () => {
      callback(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isNative]);

  // Performance optimizations for native
  const shouldUseNativeOptimizations = useCallback(() => {
    return isNative && (platform === 'ios' || platform === 'android');
  }, [isNative, platform]);

  // Device info
  const getDeviceInfo = useCallback(() => {
    return {
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web'
    };
  }, [isNative, platform]);

  return {
    // Device info
    isNative,
    platform,
    getDeviceInfo,
    
    // Haptics
    hapticFeedback,
    
    // Sharing
    nativeShare,
    
    // Toast
    showToast,
    
    // Status bar
    setStatusBarStyle,
    hideStatusBar,
    showStatusBar,
    setStatusBarColor,
    
    // App state
    addAppStateListener,
    
    // Optimizations
    shouldUseNativeOptimizations
  };
};