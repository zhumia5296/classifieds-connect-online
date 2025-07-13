import { useState } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistance } from 'date-fns';
import { Check, CheckCheck } from "lucide-react";

interface ChatMessageProps {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: string;
  isRead: boolean;
  isCurrentUser: boolean;
  onMarkAsRead?: (messageId: string) => void;
}

const ChatMessage = ({
  id,
  content,
  senderId,
  senderName,
  timestamp,
  isRead,
  isCurrentUser,
  onMarkAsRead
}: ChatMessageProps) => {
  const formatTime = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const handleMarkAsRead = () => {
    if (!isCurrentUser && !isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <div
      className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${
        !isRead && !isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">
          {senderName ? senderName[0].toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isCurrentUser ? 'You' : senderName || 'User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground break-words">
          {content}
        </p>
        
        <div className="flex items-center justify-between">
          <div />
          {isCurrentUser && (
            <div className="flex items-center gap-1">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;