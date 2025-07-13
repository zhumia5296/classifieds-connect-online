import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user';

interface AdminHook {
  userRole: UserRole | null;
  isAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  error: string | null;
  refreshRole: () => Promise<void>;
}

export const useAdmin = (): AdminHook => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: roleError } = await supabase.rpc('get_user_role', {
        _user_id: user.id
      });

      if (roleError) throw roleError;

      setUserRole(data || 'user');
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError('Failed to fetch user role');
      setUserRole('user'); // Default to user role on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  const refreshRole = async () => {
    await fetchUserRole();
  };

  return {
    userRole,
    isAdmin: userRole === 'admin',
    isModerator: userRole === 'moderator' || userRole === 'admin',
    loading,
    error,
    refreshRole
  };
};