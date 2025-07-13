import { useState, useRef, useCallback, useMemo } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemKey?: (index: number) => string | number;
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    key: string | number;
    item: T;
  }>;
  totalHeight: number;
  scrollElementProps: {
    ref: React.RefObject<HTMLDivElement>;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    style: React.CSSProperties;
  };
  containerProps: {
    style: React.CSSProperties;
  };
}

export const useVirtualScroll = <T,>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> => {
  const {
    itemHeight,
    containerHeight,
    overscan = 3,
    getItemKey = (index) => index
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { virtualItems, totalHeight } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const virtualItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        key: getItemKey(i),
        item: items[i]
      });
    }

    return { virtualItems, totalHeight };
  }, [items, itemHeight, containerHeight, scrollTop, overscan, getItemKey]);

  return {
    virtualItems,
    totalHeight,
    scrollElementProps: {
      ref: scrollElementRef,
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto'
      }
    },
    containerProps: {
      style: {
        height: totalHeight,
        position: 'relative'
      }
    }
  };
};

// Hook for infinite scrolling
interface InfiniteScrollOptions {
  hasNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = (options: InfiniteScrollOptions) => {
  const {
    hasNextPage,
    fetchNextPage,
    threshold = 1.0,
    rootMargin = '0px'
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  const setLoadingRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node && hasNextPage) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchNextPage();
          }
        },
        { threshold, rootMargin }
      );
      observerRef.current.observe(node);
    }

    loadingRef.current = node;
  }, [hasNextPage, fetchNextPage, threshold, rootMargin]);

  return { loadingRef: setLoadingRef };
};