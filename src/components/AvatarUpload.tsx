import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string | null;
  onAvatarUpdate: (avatarUrl: string | null) => void;
  displayName?: string;
  userEmail?: string;
}

const AvatarUpload = ({ 
  userId, 
  currentAvatar, 
  onAvatarUpdate, 
  displayName, 
  userEmail 
}: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setShowDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      // Delete existing avatar if exists
      if (currentAvatar) {
        const existingPath = currentAvatar.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${existingPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarUpdate(avatarUrl);
      setShowDialog(false);
      setPreviewUrl(null);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully"
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);

      // Delete from storage if exists
      if (currentAvatar) {
        const existingPath = currentAvatar.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${existingPath}`]);
        }
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      onAvatarUpdate(null);

      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed"
      });

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error",
        description: "Failed to remove avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return (
    <>
      <div className="relative group">
        <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
          <AvatarImage src={currentAvatar || undefined} alt="Profile" />
          <AvatarFallback className="text-2xl bg-gradient-primary">
            {displayName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Button */}
        <Button
          size="sm"
          className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Remove Avatar Button */}
      {currentAvatar && (
        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removeAvatar}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </div>
      )}

      {/* Upload Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            {previewUrl && (
              <div className="flex justify-center">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={previewUrl} alt="Preview" />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              </div>
            )}

            <p className="text-center text-muted-foreground text-sm">
              This will replace your current profile picture.
            </p>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setPreviewUrl(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUpload;