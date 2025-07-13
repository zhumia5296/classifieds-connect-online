import { lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Lazy loaded components with proper error boundaries
export const LazyIndex = lazy(() => import('@/pages/Index'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyPostAd = lazy(() => import('@/pages/PostAd'));
export const LazyAdDetail = lazy(() => import('@/pages/AdDetail'));
export const LazyMessages = lazy(() => import('@/pages/Messages'));
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyMobileOptimization = lazy(() => import('@/pages/MobileOptimization'));
export const LazyAdmin = lazy(() => import('@/pages/Admin'));

// Lazy loaded components for sections
export const LazyAdGrid = lazy(() => import('@/components/AdGrid'));
export const LazyHeroSection = lazy(() => import('@/components/HeroSection'));
export const LazyCategoryNav = lazy(() => import('@/components/CategoryNav'));

// Loading components
export const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <Skeleton className="h-10 w-64" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

export const ComponentSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const CardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  title?: string;
}

export const ErrorFallback = ({ 
  error, 
  resetError, 
  title = "Something went wrong" 
}: ErrorFallbackProps) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
    <Alert variant="destructive" className="max-w-md">
      <AlertDescription className="space-y-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm">{error.message}</p>
        <Button 
          onClick={resetError} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  </div>
);

// Optimized loading states
export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const GridSkeleton = ({ 
  cols = 3, 
  rows = 2 
}: { 
  cols?: number; 
  rows?: number; 
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-6`}>
    {Array.from({ length: cols * rows }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);