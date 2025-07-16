import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle,
  Mail,
  Copy,
  ExternalLink
} from "lucide-react";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  price?: string;
  location?: string;
  image?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

const SocialShare = ({
  url,
  title,
  description = '',
  price,
  location,
  image,
  variant = 'ghost',
  size = 'icon',
  showLabel = false
}: SocialShareProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Create share text
  const shareText = `${title}${price ? ` - ${price}` : ''}${location ? ` in ${location}` : ''}`;
  const fullDescription = description ? `${shareText}\n\n${description}` : shareText;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Ad link copied to clipboard.",
      });
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: fullDescription,
          url: url
        });
        setIsOpen(false);
      } catch (err) {
        // User cancelled sharing or sharing failed
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Native sharing failed:', err);
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`,
    email: `mailto:?subject=${encodeURIComponent(`Check out: ${title}`)}&body=${encodeURIComponent(`${fullDescription}\n\n${url}`)}`
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className={`h-4 w-4 ${showLabel ? 'mr-2' : ''}`} />
          {showLabel && 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Native Share (if supported) */}
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}
        
        {/* Social Media Platforms */}
        <DropdownMenuItem onClick={() => openShareWindow(shareUrls.facebook)}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareUrls.twitter)}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareUrls.linkedin)}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareUrls.whatsapp)}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => openShareWindow(shareUrls.email)}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
        
        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShare;