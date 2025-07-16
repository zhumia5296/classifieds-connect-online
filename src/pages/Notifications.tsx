import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import NotificationCenter from '@/components/NotificationCenter';

const Notifications = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <NotificationCenter />
        </div>
      </div>
    </div>
  );
};

export default Notifications;