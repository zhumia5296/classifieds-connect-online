import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickImageGalleryProps {
  images: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  title?: string;
}

export const QuickImageGallery = ({
  images,
  isOpen,
  onOpenChange,
  initialIndex = 0,
  title
}: QuickImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const previousImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-background">
        <div className="relative w-full h-[70vh] flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <img
            src={images[currentIndex]}
            alt={`${title || 'Image'} ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

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
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="p-4 border-t">
            <div className="flex gap-2 overflow-x-auto justify-center">
              {images.map((image, index) => (
                <button
                  key={index}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all hover:scale-105",
                    index === currentIndex ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickImageGallery;