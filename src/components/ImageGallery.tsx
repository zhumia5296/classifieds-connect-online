import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Download,
  X,
  Maximize,
  Grid3X3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose?: () => void;
  showThumbnails?: boolean;
  showDownload?: boolean;
  className?: string;
}

interface FullscreenGalleryProps extends ImageGalleryProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImageGallery = ({
  images,
  initialIndex = 0,
  title,
  onClose,
  showThumbnails = true,
  showDownload = false,
  className
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          previousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      resetZoom();
    }
  }, [images.length]);

  const previousImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      resetZoom();
    }
  }, [images.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleClose = () => {
    resetZoom();
    onClose?.();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  // Mouse drag functionality for zoomed images
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && zoom > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  if (images.length === 0) return null;

  return (
    <div className={cn("relative w-full h-full bg-background", className)}>
      {/* Main Image Container */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <div
          className="relative w-full h-full flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
        >
          <img
            src={images[currentIndex]}
            alt={`${title || 'Image'} ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            draggable={false}
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={previousImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm"
          >
            {currentIndex + 1} / {images.length}
          </Badge>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            onClick={resetZoom}
            disabled={zoom === 1 && position.x === 0 && position.y === 0}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {showDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background/90 backdrop-blur-sm"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && images.length > 1 && !showGrid && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all hover:scale-105",
                index === currentIndex ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-primary/50"
              )}
              onClick={() => {
                setCurrentIndex(index);
                resetZoom();
              }}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Grid View */}
      {showGrid && images.length > 1 && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <button
                key={index}
                className={cn(
                  "aspect-square rounded overflow-hidden border-2 transition-all hover:scale-105",
                  index === currentIndex ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-primary/50"
                )}
                onClick={() => {
                  setCurrentIndex(index);
                  setShowGrid(false);
                  resetZoom();
                }}
              >
                <img
                  src={image}
                  alt={`Grid image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const FullscreenImageGallery = ({
  isOpen,
  onOpenChange,
  images,
  initialIndex = 0,
  title,
  showDownload = true,
  ...props
}: FullscreenGalleryProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background/95 backdrop-blur-sm">
        <div className="relative w-full h-full">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 z-10 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <ImageGallery
            images={images}
            initialIndex={initialIndex}
            title={title}
            showDownload={showDownload}
            className="p-4"
            {...props}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageGallery;