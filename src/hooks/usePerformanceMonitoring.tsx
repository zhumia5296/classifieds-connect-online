import { useState, useEffect, useCallback, useMemo } from 'react';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Memory usage
  memoryUsage: number | null;
  
  // Network performance
  connectionType: string;
  downlink: number | null;
  rtt: number | null;
  
  // Bundle metrics
  jsHeapSize: number | null;
  totalJSHeapSize: number | null;
}

interface PerformanceOptions {
  enableWebVitals?: boolean;
  enableMemoryTracking?: boolean;
  enableNetworkTracking?: boolean;
  reportingUrl?: string;
  sampleRate?: number;
}

export const usePerformanceMonitoring = (options: PerformanceOptions = {}) => {
  const {
    enableWebVitals = true,
    enableMemoryTracking = true,
    enableNetworkTracking = true,
    reportingUrl,
    sampleRate = 1.0
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    memoryUsage: null,
    connectionType: 'unknown',
    downlink: null,
    rtt: null,
    jsHeapSize: null,
    totalJSHeapSize: null
  });

  const [isSupported, setIsSupported] = useState({
    webVitals: false,
    memory: false,
    network: false
  });

  // Report metrics to analytics service
  const reportMetrics = useCallback(async (metric: Partial<PerformanceMetrics>) => {
    if (Math.random() > sampleRate) return;
    
    if (reportingUrl) {
      try {
        await fetch(reportingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...metric,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
          })
        });
      } catch (error) {
        console.warn('Failed to report performance metrics:', error);
      }
    }
  }, [reportingUrl, sampleRate]);

  // Web Vitals measurement
  useEffect(() => {
    if (!enableWebVitals) return;

    let observer: PerformanceObserver;

    const measureWebVitals = () => {
      if ('PerformanceObserver' in window) {
        setIsSupported(prev => ({ ...prev, webVitals: true }));

        // Largest Contentful Paint
        observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.startTime;
          
          setMetrics(prev => ({ ...prev, lcp }));
          reportMetrics({ lcp });
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP measurement not supported');
        }

        // First Input Delay
        const measureFID = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            setMetrics(prev => ({ ...prev, fid }));
            reportMetrics({ fid });
          });
        });

        try {
          measureFID.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          console.warn('FID measurement not supported');
        }

        // Cumulative Layout Shift
        let clsValue = 0;
        const measureCLS = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              setMetrics(prev => ({ ...prev, cls: clsValue }));
            }
          });
        });

        try {
          measureCLS.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('CLS measurement not supported');
        }

        // First Contentful Paint
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.fetchStart;
          setMetrics(prev => ({ ...prev, ttfb }));
          reportMetrics({ ttfb });
        }

        // Paint timing
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          const fcp = fcpEntry.startTime;
          setMetrics(prev => ({ ...prev, fcp }));
          reportMetrics({ fcp });
        }
      }
    };

    measureWebVitals();

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [enableWebVitals, reportMetrics]);

  // Memory usage tracking
  useEffect(() => {
    if (!enableMemoryTracking) return;

    const trackMemory = () => {
      if ('memory' in performance) {
        setIsSupported(prev => ({ ...prev, memory: true }));
        
        const updateMemoryMetrics = () => {
          const memory = (performance as any).memory;
          const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
          const jsHeapSize = memory.usedJSHeapSize;
          const totalJSHeapSize = memory.totalJSHeapSize;
          
          setMetrics(prev => ({ 
            ...prev, 
            memoryUsage,
            jsHeapSize,
            totalJSHeapSize 
          }));
        };

        updateMemoryMetrics();
        const interval = setInterval(updateMemoryMetrics, 5000);
        
        return () => clearInterval(interval);
      }
    };

    return trackMemory();
  }, [enableMemoryTracking]);

  // Network performance tracking
  useEffect(() => {
    if (!enableNetworkTracking) return;

    const trackNetwork = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        setIsSupported(prev => ({ ...prev, network: true }));
        
        const updateNetworkMetrics = () => {
          setMetrics(prev => ({
            ...prev,
            connectionType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || null,
            rtt: connection.rtt || null
          }));
        };

        updateNetworkMetrics();
        connection.addEventListener('change', updateNetworkMetrics);
        
        return () => {
          connection.removeEventListener('change', updateNetworkMetrics);
        };
      }
    };

    return trackNetwork();
  }, [enableNetworkTracking]);

  // Performance score calculation
  const performanceScore = useMemo(() => {
    let score = 100;
    
    // LCP scoring (target: < 2.5s)
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) score -= 30;
      else if (metrics.lcp > 2500) score -= 15;
    }
    
    // FID scoring (target: < 100ms)
    if (metrics.fid !== null) {
      if (metrics.fid > 300) score -= 25;
      else if (metrics.fid > 100) score -= 10;
    }
    
    // CLS scoring (target: < 0.1)
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) score -= 25;
      else if (metrics.cls > 0.1) score -= 10;
    }
    
    // Memory usage scoring
    if (metrics.memoryUsage !== null) {
      if (metrics.memoryUsage > 100) score -= 15; // > 100MB
      else if (metrics.memoryUsage > 50) score -= 5; // > 50MB
    }
    
    return Math.max(0, score);
  }, [metrics]);

  // Get performance grade
  const getPerformanceGrade = useCallback((score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, []);

  // Manual performance measurement
  const measureCustomMetric = useCallback((name: string, startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(`Custom metric ${name}: ${duration}ms`);
    reportMetrics({ [name]: duration } as any);
    return duration;
  }, [reportMetrics]);

  return {
    metrics,
    isSupported,
    performanceScore,
    performanceGrade: getPerformanceGrade(performanceScore),
    measureCustomMetric,
    reportMetrics
  };
};