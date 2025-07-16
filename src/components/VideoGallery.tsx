import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  is_primary: boolean;
  duration_seconds?: number;
  file_size_bytes?: number;
}

interface VideoGalleryProps {
  videos: Video[];
  className?: string;
  autoplay?: boolean;
  showDuration?: boolean;
  showControls?: boolean;
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  videos,
  className = '',
  autoplay = false,
  showDuration = true,
  showControls = true
}) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(
    videos.find(v => v.is_primary) || videos[0] || null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!videos || videos.length === 0) {
    return null;
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const videoElement = document.getElementById('main-video') as HTMLVideoElement;
    if (videoElement) {
      if (!isFullscreen && videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
        setIsFullscreen(true);
      } else if (isFullscreen && document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleVideoLoad = () => {
    if (autoplay) {
      setIsPlaying(true);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Video Player */}
      {selectedVideo && (
        <Card className="relative overflow-hidden">
          <div className="relative bg-black">
            <video
              id="main-video"
              src={selectedVideo.video_url}
              poster={selectedVideo.thumbnail_url}
              className="w-full h-64 md:h-96 object-contain"
              controls={showControls}
              muted={isMuted}
              autoPlay={autoplay}
              preload="metadata"
              onLoadedData={handleVideoLoad}
              onEnded={handleVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Custom Controls Overlay */}
            {!showControls && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 text-white"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 text-white"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 text-white"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Duration Badge */}
            {showDuration && selectedVideo.duration_seconds && (
              <Badge 
                variant="secondary" 
                className="absolute bottom-2 right-2 bg-black/50 text-white"
              >
                {formatDuration(selectedVideo.duration_seconds)}
              </Badge>
            )}

            {/* Primary Badge */}
            {selectedVideo.is_primary && (
              <Badge 
                variant="default" 
                className="absolute top-2 left-2"
              >
                Featured
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Video Thumbnails */}
      {videos.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {videos.map((video) => (
            <Card
              key={video.id}
              className={`relative cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                selectedVideo?.id === video.id 
                  ? 'ring-2 ring-primary' 
                  : 'ring-1 ring-border'
              }`}
              onClick={() => handleVideoClick(video)}
            >
              <div className="relative aspect-video">
                <video
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  className="w-full h-full object-cover rounded"
                  preload="metadata"
                  muted
                />
                
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-black/50 rounded-full p-2">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </div>
                </div>

                {/* Duration */}
                {showDuration && video.duration_seconds && (
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-1 right-1 text-xs bg-black/50 text-white"
                  >
                    {formatDuration(video.duration_seconds)}
                  </Badge>
                )}

                {/* Primary Indicator */}
                {video.is_primary && (
                  <div className="absolute top-1 left-1 w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Video Info */}
      {selectedVideo && (
        <div className="text-sm text-muted-foreground">
          {selectedVideo.alt_text && (
            <p className="mb-1">{selectedVideo.alt_text}</p>
          )}
          <div className="flex items-center gap-4">
            {selectedVideo.duration_seconds && (
              <span>Duration: {formatDuration(selectedVideo.duration_seconds)}</span>
            )}
            {selectedVideo.file_size_bytes && (
              <span>
                Size: {(selectedVideo.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};