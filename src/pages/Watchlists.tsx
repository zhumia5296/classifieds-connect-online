import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import WatchlistManager from '@/components/WatchlistManager';

const Watchlists = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WatchlistManager />
    </div>
  );
};

export default Watchlists;