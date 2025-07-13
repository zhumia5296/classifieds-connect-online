import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from 'date-fns';
import { Check, CheckCheck, Reply, MoreVertical, Edit3, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatMessageProps {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: string;
  isRead: boolean;
  isCurrentUser: boolean;
  messageType?: string;
  editedAt?: string;
  replyToMessageId?: string;
  onMarkAsRead?: (messageId: string) => void;
  onReply?: (messageId: string, content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

const ChatMessage = ({
  id,
  content,
  senderId,
  senderName,
  senderAvatar,
  timestamp,
  isRead,
  isCurrentUser,
  messageType = 'text',
  editedAt,
  replyToMessageId,
  onMarkAsRead,
  onReply,
  onEdit,
  onDelete
}: ChatMessageProps) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else {
        return formatDistance(date, now, { addSuffix: true });
      }
    } catch {
      return 'Recently';
    }
  };

  const handleMarkAsRead = () => {
    if (!isCurrentUser && !isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(id, content);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      const newContent = prompt('Edit message:', content);
      if (newContent && newContent !== content) {
        onEdit(id, newContent);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this message?')) {
      onDelete(id);
    }
  };

  return (
    <div
      className={`group flex gap-3 p-3 hover:bg-muted/30 transition-colors ${
        isCurrentUser ? 'flex-row-reverse' : ''
      } ${!isRead && !isCurrentUser ? 'bg-primary/5' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleMarkAsRead}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        {senderAvatar ? (
          <AvatarImage src={senderAvatar} alt={senderName} />
        ) : (
          <AvatarFallback className="text-xs">
            {senderName ? senderName[0].toUpperCase() : 'U'}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className={`flex-1 space-y-1 ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col max-w-[70%]`}>
        <div className={`flex items-center gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-muted-foreground">
            {isCurrentUser ? 'You' : senderName || 'User'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </span>
          {editedAt && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              edited
            </Badge>
          )}
        </div>
        
        <div className={`relative group/message ${isCurrentUser ? 'self-end' : 'self-start'}`}>
          <div
            className={`rounded-2xl px-4 py-2 max-w-full break-words ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted rounded-bl-md'
            }`}
          >
            {replyToMessageId && (
              <div className="text-xs opacity-70 border-l-2 border-current pl-2 mb-2 italic">
                Replying to a message
              </div>
            )}
            
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          </div>

          {/* Message Actions */}
          {(showActions || window.innerWidth <= 768) && (
            <div className={`absolute top-0 ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} 
                         flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-background"
                onClick={handleReply}
              >
                <Reply className="h-3 w-3" />
              </Button>
              
              {isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-background"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit3 className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
        
        {/* Read Status for sent messages */}
        {isCurrentUser && (
          <div className="flex items-center justify-end">
            {isRead ? (
              <CheckCheck className="h-3 w-3 text-primary" />
            ) : (
              <Check className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;