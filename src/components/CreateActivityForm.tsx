import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useActivities } from "@/hooks/useActivities";

const activityTypes = [
  { value: "status_update", label: "📝 Status Update", icon: "📝" },
  { value: "achievement", label: "🏆 Achievement", icon: "🏆" },
  { value: "milestone", label: "🎯 Milestone", icon: "🎯" },
  { value: "announcement", label: "📢 Announcement", icon: "📢" },
  { value: "celebration", label: "🎉 Celebration", icon: "🎉" },
];

export const CreateActivityForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("");
  
  const { createActivity } = useActivities();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !activityType) return;

    createActivity.mutate({
      activity_type: activityType,
      title: title.trim(),
      description: description.trim() || undefined,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setActivityType("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Button 
            onClick={() => setIsOpen(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Share an update...
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Create Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-type">Activity Type</Label>
            <Select value={activityType} onValueChange={setActivityType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={!title.trim() || !activityType || createActivity.isPending}
            >
              {createActivity.isPending ? "Posting..." : "Post Activity"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                setTitle("");
                setDescription("");
                setActivityType("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};