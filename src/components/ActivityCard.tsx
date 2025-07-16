import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Activity, useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface ActivityCardProps {
  activity: Activity;
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const { user } = useAuth();
  const { deleteActivity } = useActivities();

  const canDelete = user?.id === activity.user_id;

  const handleDelete = () => {
    deleteActivity.mutate(activity.id);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ad_posted":
        return "📢";
      case "ad_sold":
        return "💰";
      case "profile_updated":
        return "👤";
      case "achievement":
        return "🏆";
      default:
        return "📝";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "ad_posted":
        return "bg-primary";
      case "ad_sold":
        return "bg-green-500";
      case "profile_updated":
        return "bg-blue-500";
      case "achievement":
        return "bg-yellow-500";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={activity.profile?.avatar_url || ""} />
              <AvatarFallback>
                {activity.profile?.display_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {activity.profile?.display_name || "Unknown User"}
                </span>
                <Badge variant="secondary" className={getActivityColor(activity.activity_type)}>
                  <span className="mr-1">{getActivityIcon(activity.activity_type)}</span>
                  {activity.activity_type.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteActivity.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <h3 className="font-semibold mb-2">{activity.title}</h3>
        {activity.description && (
          <p className="text-muted-foreground mb-3">{activity.description}</p>
        )}
        
        {activity.ad && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activity.ad.title}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.ad.currency} {activity.ad.price}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/ad/${activity.ad_id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {Object.keys(activity.metadata).length > 0 && (
          <div className="mt-3 space-y-1">
            {Object.entries(activity.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key.replace("_", " ")}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};