import { useState, useCallback, useRef, useEffect } from 'react';

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
}

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  options?: ImageOptimizationOptions;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  options = {},
  onLoad,
  onError,
  className,
  ...props
}: OptimizedImageProps) => {
  const {
    quality = 85,
    format = 'webp',
    lazy = true,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
    priority = false
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [lazy, priority, isInView]);

  // Generate optimized source URLs
  const getOptimizedSrc = useCallback((originalSrc: string, targetWidth?: number) => {
    // If it's already a data URL or external URL, return as-is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, we could integrate with image optimization services
    // For now, return the original src
    return originalSrc;
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    setIsLoaded(true);
    onError?.();
  }, [onError]);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback((baseSrc: string) => {
    if (!width) return undefined;
    
    const sizes = [1, 1.5, 2, 3];
    return sizes
      .map(scale => {
        const scaledWidth = Math.round(width * scale);
        return `${getOptimizedSrc(baseSrc, scaledWidth)} ${scale}x`;
      })
      .join(', ');
  }, [width, getOptimizedSrc]);

  // Don't render anything if not in view and lazy loading
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          width: width || 'auto',
          height: height || 'auto',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        {...props}
      >
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <picture>
      {/* WebP source for supported browsers */}
      {format === 'webp' && (
        <source
          srcSet={generateSrcSet(src)}
          type="image/webp"
          sizes={options.sizes}
        />
      )}
      
      <img
        ref={imgRef}
        src={error ? placeholder : getOptimizedSrc(src, width)}
        srcSet={generateSrcSet(src)}
        alt={alt}
        width={width}
        height={height}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className || ''}`}
        {...props}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !error && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{
            width: width || '100%',
            height: height || 'auto'
          }}
        />
      )}
    </picture>
  );
};

// Hook for image preloading
export const useImagePreloader = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (loadedImages.has(src)) {
      return Promise.resolve();
    }

    if (loadingImages.has(src)) {
      // Return existing promise
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (loadedImages.has(src)) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    setLoadingImages(prev => new Set(prev).add(src));

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(src));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        resolve();
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }, [loadedImages, loadingImages]);

  const preloadImages = useCallback(async (urls: string[]) => {
    const promises = urls.map(url => preloadImage(url));
    await Promise.allSettled(promises);
  }, [preloadImage]);

  return {
    preloadImage,
    preloadImages,
    isImageLoaded: (src: string) => loadedImages.has(src),
    isImageLoading: (src: string) => loadingImages.has(src)
  };
};