import { useActivityFeed, useUserActivities } from "@/hooks/useActivities";
import { useAuth } from "@/hooks/useAuth";
import { ActivityCard } from "@/components/ActivityCard";
import { CreateActivityForm } from "@/components/CreateActivityForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity as ActivityIcon } from "lucide-react";

export const ActivityFeed = () => {
  const { user } = useAuth();
  const { data: activityFeed, isLoading: feedLoading } = useActivityFeed();
  const { data: userActivities, isLoading: userLoading } = useUserActivities(user?.id || "");

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to view your activity feed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Activity Feed</h1>
        <p className="text-muted-foreground">
          Stay connected with your network and share updates
        </p>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Following Feed
          </TabsTrigger>
          <TabsTrigger value="my-activities" className="flex items-center gap-2">
            <ActivityIcon className="h-4 w-4" />
            My Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          <CreateActivityForm />
          
          <div className="space-y-4">
            {feedLoading ? (
              <LoadingSkeleton />
            ) : activityFeed && activityFeed.length > 0 ? (
              activityFeed.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
                  <p className="text-muted-foreground">
                    Follow other users to see their activities in your feed, or create your own activity to get started!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-activities" className="space-y-6">
          <div className="space-y-4">
            {userLoading ? (
              <LoadingSkeleton />
            ) : userActivities && userActivities.length > 0 ? (
              userActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
                  <p className="text-muted-foreground">
                    Share your first activity to let your followers know what you're up to!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};