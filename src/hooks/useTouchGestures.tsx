import { useEffect, useRef, useState, useCallback } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  timeStamp: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  velocity: number;
}

interface PinchGesture {
  scale: number;
  center: TouchPoint;
}

interface TouchGestureOptions {
  onSwipe?: (gesture: SwipeGesture) => void;
  onPinch?: (gesture: PinchGesture) => void;
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
  
  // Configuration
  swipeThreshold?: number;
  pinchThreshold?: number;
  tapTimeout?: number;
  doubleTapTimeout?: number;
  longPressTimeout?: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipe,
    onPinch,
    onTap,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50,
    pinchThreshold = 0.1,
    tapTimeout = 200,
    doubleTapTimeout = 300,
    longPressTimeout = 500
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const lastTapRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  
  const [isTracking, setIsTracking] = useState(false);

  const getTouchPoint = useCallback((touch: React.Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    timeStamp: Date.now()
  }), []);

  const getDistance = useCallback((point1: TouchPoint, point2: TouchPoint): number => 
    Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
  , []);

  const getPinchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): SwipeGesture['direction'] => {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    const touchPoint = getTouchPoint(touch);
    touchStartRef.current = touchPoint;
    setIsTracking(true);

    // Handle pinch start
    if (event.touches.length === 2) {
      initialPinchDistanceRef.current = getPinchDistance(event.touches);
      return;
    }

    // Set up long press detection
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(touchPoint);
        setIsTracking(false);
      }, longPressTimeout);
    }
  }, [getTouchPoint, getPinchDistance, onLongPress, longPressTimeout]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isTracking || !touchStartRef.current) return;

    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pinch
    if (event.touches.length === 2 && onPinch && initialPinchDistanceRef.current) {
      const currentDistance = getPinchDistance(event.touches);
      const scale = currentDistance / initialPinchDistanceRef.current;
      
      if (Math.abs(scale - 1) > pinchThreshold) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
          timeStamp: Date.now()
        };
        
        onPinch({ scale, center });
      }
    }
  }, [isTracking, onPinch, getPinchDistance, pinchThreshold]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isTracking || !touchStartRef.current) {
      setIsTracking(false);
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      setIsTracking(false);
      return;
    }

    const endPoint = getTouchPoint(touch);
    const distance = getDistance(touchStartRef.current, endPoint);
    const duration = endPoint.timeStamp - touchStartRef.current.timeStamp;

    // Handle swipe
    if (distance > swipeThreshold && onSwipe) {
      const direction = getSwipeDirection(touchStartRef.current, endPoint);
      const velocity = distance / duration;
      
      onSwipe({
        direction,
        distance,
        duration,
        velocity
      });
    } 
    // Handle tap/double tap
    else if (distance < 10 && duration < tapTimeout) {
      const currentTime = Date.now();
      
      // Check for double tap
      if (lastTapRef.current && 
          currentTime - lastTapRef.current.timeStamp < doubleTapTimeout &&
          getDistance(lastTapRef.current, endPoint) < 50) {
        if (onDoubleTap) {
          onDoubleTap(endPoint);
        }
        lastTapRef.current = null;
      } else {
        lastTapRef.current = endPoint;
        
        // Single tap with delay to detect double tap
        setTimeout(() => {
          if (lastTapRef.current === endPoint && onTap) {
            onTap(endPoint);
          }
        }, doubleTapTimeout);
      }
    }

    touchStartRef.current = null;
    initialPinchDistanceRef.current = null;
    setIsTracking(false);
  }, [isTracking, getTouchPoint, getDistance, getSwipeDirection, swipeThreshold, tapTimeout, doubleTapTimeout, onSwipe, onTap, onDoubleTap]);

  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    gestureHandlers,
    isTracking
  };
};

// Hook for swipe navigation
export const useSwipeNavigation = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) => {
  return useTouchGestures({
    onSwipe: (gesture) => {
      switch (gesture.direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    },
    swipeThreshold: 75
  });
};

// Hook for pull-to-refresh
export const usePullToRefresh = (onRefresh: () => void | Promise<void>) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number>(0);
  const refreshThreshold = 80;

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startYRef.current = event.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (window.scrollY > 0 || !startYRef.current) return;

    const currentY = event.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    
    if (distance > 10) {
      setIsPulling(true);
      setPullDistance(Math.min(distance, refreshThreshold * 1.5));
      event.preventDefault();
    }
  }, [refreshThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= refreshThreshold) {
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startYRef.current = 0;
  }, [pullDistance, refreshThreshold, onRefresh]);

  const pullToRefreshHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  };

  return {
    pullToRefreshHandlers,
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / refreshThreshold, 1)
  };
};