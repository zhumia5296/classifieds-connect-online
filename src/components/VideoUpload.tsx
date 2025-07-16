import React, { useState, useRef } from 'react';
import { Upload, Video, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  adId?: string;
  onVideoUploaded: (videoData: {
    id: string;
    video_url: string;
    thumbnail_url?: string;
    duration_seconds?: number;
    file_size_bytes: number;
    mime_type: string;
  }) => void;
  onVideoRemoved: (videoId: string) => void;
  existingVideos?: Array<{
    id: string;
    video_url: string;
    thumbnail_url?: string;
    alt_text?: string;
    is_primary: boolean;
    duration_seconds?: number;
    file_size_bytes?: number;
  }>;
  maxVideos?: number;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  adId,
  onVideoUploaded,
  onVideoRemoved,
  existingVideos = [],
  maxVideos = 3
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const acceptedVideoTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateVideo = (file: File): string | null => {
    if (!acceptedVideoTypes.includes(file.type)) {
      return 'Please select a valid video file (MP4, MOV, AVI, WebM)';
    }
    if (file.size > maxFileSize) {
      return 'Video file size must be less than 50MB';
    }
    if (existingVideos.length >= maxVideos) {
      return `Maximum ${maxVideos} videos allowed`;
    }
    return null;
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Get thumbnail at 1 second
      });

      video.addEventListener('seeked', () => {
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.8);
        }
      });

      video.addEventListener('error', reject);
      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.addEventListener('loadedmetadata', () => {
        resolve(video.duration);
      });
      video.addEventListener('error', reject);
      video.src = URL.createObjectURL(file);
    });
  };

  const uploadVideo = async (file: File) => {
    if (!adId) {
      toast({
        title: "Create Ad First",
        description: "Please create your ad before uploading videos",
        variant: "destructive"
      });
      return;
    }

    const validation = validateVideo(file);
    if (validation) {
      toast({
        title: "Invalid Video",
        description: validation,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${adId}/${Date.now()}.${fileExt}`;

      // Upload video file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ad-videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get video duration and generate thumbnail
      const [duration, thumbnailData] = await Promise.all([
        getVideoDuration(file).catch(() => null),
        generateThumbnail(file).catch(() => null)
      ]);

      let thumbnailUrl = null;
      if (thumbnailData) {
        // Upload thumbnail
        const thumbnailBlob = await fetch(thumbnailData).then(r => r.blob());
        const thumbnailFileName = `${user.id}/${adId}/thumb_${Date.now()}.jpg`;
        
        const { data: thumbUpload } = await supabase.storage
          .from('ad-videos')
          .upload(thumbnailFileName, thumbnailBlob);

        if (thumbUpload) {
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('ad-videos')
            .getPublicUrl(thumbUpload.path);
          thumbnailUrl = thumbUrl;
        }
      }

      // Get public URL for video
      const { data: { publicUrl } } = supabase.storage
        .from('ad-videos')
        .getPublicUrl(uploadData.path);

      // Save video record to database
      const { data: videoRecord, error: dbError } = await supabase
        .from('ad_videos')
        .insert({
          ad_id: adId,
          video_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          duration_seconds: duration ? Math.round(duration) : null,
          file_size_bytes: file.size,
          mime_type: file.type,
          is_primary: existingVideos.length === 0
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onVideoUploaded(videoRecord);

      toast({
        title: "Video Uploaded",
        description: "Your video has been uploaded successfully"
      });

    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      uploadVideo(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeVideo = async (videoId: string, videoUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('ad_videos')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      // Delete from storage
      const pathParts = videoUrl.split('/ad-videos/');
      if (pathParts.length > 1) {
        await supabase.storage
          .from('ad-videos')
          .remove([pathParts[1]]);
      }

      onVideoRemoved(videoId);

      toast({
        title: "Video Removed",
        description: "Video has been deleted successfully"
      });

    } catch (error: any) {
      console.error('Remove video error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Videos ({existingVideos.length}/{maxVideos})</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Upload videos to showcase your item (MP4, MOV, AVI, WebM • Max 50MB each)
        </p>
      </div>

      {/* Upload Area */}
      {existingVideos.length < maxVideos && (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-8 text-center">
            <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Upload Video'}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag and drop or click to select
              </p>
            </div>
            
            {uploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(uploadProgress)}% uploaded
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedVideoTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={uploading}
      />

      {/* Video List */}
      {existingVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {existingVideos.map((video) => (
            <Card key={video.id} className="p-4">
              <div className="relative">
                <video
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  controls
                  className="w-full h-32 object-cover rounded"
                  preload="metadata"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeVideo(video.id, video.video_url)}
                >
                  <X className="h-3 w-3" />
                </Button>
                {video.is_primary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
              
              <div className="mt-2 space-y-1">
                {video.duration_seconds && (
                  <p className="text-xs text-muted-foreground">
                    Duration: {Math.floor(video.duration_seconds / 60)}:
                    {(video.duration_seconds % 60).toString().padStart(2, '0')}
                  </p>
                )}
                {video.file_size_bytes && (
                  <p className="text-xs text-muted-foreground">
                    Size: {(video.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {existingVideos.length >= maxVideos && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Maximum {maxVideos} videos reached. Remove a video to upload another.
          </p>
        </div>
      )}
    </div>
  );
};