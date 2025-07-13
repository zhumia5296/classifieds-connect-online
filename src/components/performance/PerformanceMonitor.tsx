import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Gauge, 
  TrendingUp, 
  Activity, 
  Clock,
  HardDrive,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useCache } from '@/hooks/useCache';

const PerformanceMonitor = () => {
  const {
    metrics,
    isSupported,
    performanceScore,
    performanceGrade,
    measureCustomMetric
  } = usePerformanceMonitoring({
    enableWebVitals: true,
    enableMemoryTracking: true,
    enableNetworkTracking: true,
    sampleRate: 1.0
  });

  const cache = useCache();
  const [cacheStats, setCacheStats] = useState({ size: 0 });
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    setCacheStats({ size: cache.size() });
  }, [cache]);

  const optimizePerformance = async () => {
    setIsOptimizing(true);
    
    try {
      // Clear caches
      cache.clear();
      
      // Clear browser caches if possible
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      }
      
      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
      
      setTimeout(() => {
        setIsOptimizing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Performance optimization failed:', error);
      setIsOptimizing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeVariant = (grade: string) => {
    if (grade === 'A' || grade === 'B') return 'default';
    if (grade === 'C') return 'secondary';
    return 'destructive';
  };

  const formatMetric = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === 'MB') {
      return `${Math.round(value)}MB`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="space-y-6">
      {/* Performance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            
            <div className="text-center">
              <Badge variant={getGradeVariant(performanceGrade)} className="text-lg px-4 py-2">
                {performanceGrade}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Grade</div>
            </div>
            
            <Button 
              onClick={optimizePerformance}
              disabled={isOptimizing}
              variant="outline"
              size="sm"
            >
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Optimize
            </Button>
          </div>
          
          <Progress value={performanceScore} className="w-full" />
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">LCP</span>
              </div>
              <div className="text-lg font-semibold">
                {formatMetric(metrics.lcp)}
              </div>
              <div className="text-xs text-muted-foreground">
                Largest Contentful Paint
              </div>
              {metrics.lcp !== null && (
                <Badge 
                  variant={metrics.lcp < 2500 ? 'default' : metrics.lcp < 4000 ? 'secondary' : 'destructive'}
                  className="mt-2"
                >
                  {metrics.lcp < 2500 ? 'Good' : metrics.lcp < 4000 ? 'Needs Work' : 'Poor'}
                </Badge>
              )}
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">FID</span>
              </div>
              <div className="text-lg font-semibold">
                {formatMetric(metrics.fid)}
              </div>
              <div className="text-xs text-muted-foreground">
                First Input Delay
              </div>
              {metrics.fid !== null && (
                <Badge 
                  variant={metrics.fid < 100 ? 'default' : metrics.fid < 300 ? 'secondary' : 'destructive'}
                  className="mt-2"
                >
                  {metrics.fid < 100 ? 'Good' : metrics.fid < 300 ? 'Needs Work' : 'Poor'}
                </Badge>
              )}
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">CLS</span>
              </div>
              <div className="text-lg font-semibold">
                {metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                Cumulative Layout Shift
              </div>
              {metrics.cls !== null && (
                <Badge 
                  variant={metrics.cls < 0.1 ? 'default' : metrics.cls < 0.25 ? 'secondary' : 'destructive'}
                  className="mt-2"
                >
                  {metrics.cls < 0.1 ? 'Good' : metrics.cls < 0.25 ? 'Needs Work' : 'Poor'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isSupported.memory ? (
                <>
                  <div className="flex justify-between items-center">
                    <span>JS Heap Size</span>
                    <span className="font-semibold">
                      {formatMetric(metrics.memoryUsage, 'MB')}
                    </span>
                  </div>
                  
                  {metrics.memoryUsage !== null && (
                    <Progress 
                      value={Math.min((metrics.memoryUsage / 100) * 100, 100)} 
                      className="w-full"
                    />
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Cache entries: {cacheStats.size}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  Memory monitoring not supported
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isSupported.network ? (
                <>
                  <div className="flex justify-between items-center">
                    <span>Connection Type</span>
                    <Badge variant="outline">
                      {metrics.connectionType}
                    </Badge>
                  </div>
                  
                  {metrics.downlink && (
                    <div className="flex justify-between items-center">
                      <span>Downlink Speed</span>
                      <span className="font-semibold">
                        {metrics.downlink.toFixed(1)} Mbps
                      </span>
                    </div>
                  )}
                  
                  {metrics.rtt && (
                    <div className="flex justify-between items-center">
                      <span>RTT</span>
                      <span className="font-semibold">
                        {metrics.rtt}ms
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  Network monitoring not supported
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Support */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {isSupported.webVitals ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span>Web Vitals</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isSupported.memory ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span>Memory API</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isSupported.network ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span>Network API</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;