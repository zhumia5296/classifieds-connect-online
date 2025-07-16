import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { QrCode, Download, Copy, Share2 } from "lucide-react";
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  url: string;
  title: string;
  description?: string;
  size?: number;
  variant?: 'default' | 'ghost' | 'outline';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  trigger?: React.ReactNode;
}

const QRCodeGenerator = ({
  url,
  title,
  description = '',
  size = 256,
  variant = 'ghost',
  buttonSize = 'icon',
  showLabel = false,
  trigger
}: QRCodeGeneratorProps) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const qrUrl = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !qrCodeUrl) {
      generateQRCode();
    }
  }, [isOpen, url, size]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: "QR code saved to your downloads.",
    });
  };

  const handleCopyImage = async () => {
    if (!qrCodeUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);

      toast({
        title: "QR Code Copied",
        description: "QR code copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy QR code:', err);
      toast({
        title: "Copy Failed",
        description: "Unable to copy QR code. Try downloading instead.",
        variant: "destructive"
      });
    }
  };

  const handleShareQRCode = async () => {
    if (!qrCodeUrl) return;

    if (navigator.share) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });

        await navigator.share({
          title: `QR Code for ${title}`,
          text: `Scan this QR code to view: ${title}`,
          files: [file]
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Native sharing failed:', err);
          // Fallback to copying URL
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link Copied",
            description: "QR code link copied to clipboard.",
          });
        }
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "QR code link copied to clipboard.",
      });
    }
  };

  const TriggerButton = trigger || (
    <Button variant={variant} size={buttonSize}>
      <QrCode className={`h-4 w-4 ${showLabel ? 'mr-2' : ''}`} />
      {showLabel && 'QR Code'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4 bg-white rounded-lg border-2 border-muted">
              {isLoading ? (
                <div className="flex items-center justify-center w-64 h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${title}`}
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-64 h-64 text-muted-foreground">
                  Failed to generate QR code
                </div>
              )}
            </div>
            
            {/* Title and Description */}
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-sm">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
              <Badge variant="outline" className="text-xs">
                Scan to view
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
                disabled={!qrCodeUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyImage}
                disabled={!qrCodeUrl}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            
            <Button
              onClick={handleShareQRCode}
              disabled={!qrCodeUrl}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share QR Code
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Scan with any QR code reader or camera app</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;