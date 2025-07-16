import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { useFollows, useIsFollowing } from "@/hooks/useFollows";
import { useAuth } from "@/hooks/useAuth";

interface FollowButtonProps {
  userId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const FollowButton = ({ userId, variant = "default", size = "default" }: FollowButtonProps) => {
  const { user } = useAuth();
  const { data: isFollowing, isLoading } = useIsFollowing(userId);
  const { followUser, unfollowUser } = useFollows();

  // Don't show follow button for own profile or when not authenticated
  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = () => {
    if (isFollowing) {
      unfollowUser.mutate(userId);
    } else {
      followUser.mutate(userId);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={isLoading || followUser.isPending || unfollowUser.isPending}
    >
      {isFollowing ? (
        <>
          <UserMinus className="mr-2 h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
};