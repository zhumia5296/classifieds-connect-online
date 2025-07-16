import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from './QRCodeGenerator';
import { QrCode, Share2, Copy } from "lucide-react";

interface QRCodeCardProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

const QRCodeCard = ({
  url,
  title,
  description,
  className
}: QRCodeCardProps) => {
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Link copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || title,
          url: url
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {description}
            </p>
          )}
          <Badge variant="outline" className="text-xs">
            Scan to view
          </Badge>
        </div>

        <div className="flex gap-2">
          <QRCodeGenerator
            url={url}
            title={title}
            description={description}
            variant="outline"
            buttonSize="default"
            showLabel={true}
            trigger={
              <Button variant="outline" className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR
              </Button>
            }
          />
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Generate a QR code to easily share this item
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeCard;