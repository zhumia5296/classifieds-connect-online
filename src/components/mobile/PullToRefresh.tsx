import { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/useTouchGestures';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
  className?: string;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  refreshing = false,
  className
}: PullToRefreshProps) => {
  const {
    pullToRefreshHandlers,
    isPulling,
    pullDistance,
    pullProgress
  } = usePullToRefresh(onRefresh);

  const isRefreshThresholdReached = pullProgress >= 1;

  return (
    <div className={cn("relative", className)} {...pullToRefreshHandlers}>
      {/* Pull to Refresh Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b transition-transform duration-200",
          isPulling || refreshing ? "translate-y-0" : "-translate-y-full"
        )}
        style={{
          height: Math.max(60, pullDistance * 0.8),
          transform: `translateY(${isPulling ? pullDistance * 0.8 - 60 : refreshing ? 0 : -60}px)`
        }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-sm">
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <ArrowDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isRefreshThresholdReached && "rotate-180"
                  )}
                />
                <span>
                  {isRefreshThresholdReached ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 h-1 bg-primary/30">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${Math.min(pullProgress * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "transition-transform duration-200",
          isPulling && "transform",
          refreshing && "pt-16"
        )}
        style={{
          transform: isPulling ? `translateY(${Math.max(0, pullDistance * 0.8)}px)` : undefined
        }}
      >
        {children}
      </div>
    </div>
  );
};