import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FilterOptions } from '@/components/SearchFilter';
import { Json } from '@/integrations/supabase/types';

export interface SavedSearch {
  id: string;
  name: string;
  search_query: string;
  filters: FilterOptions;
  category_ids: string[];
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface SavedSearchRow {
  id: string;
  name: string;
  search_query: string;
  filters: Json;
  category_ids: string[];
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useSavedSearches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to convert database row to SavedSearch
  const convertToSavedSearch = (row: SavedSearchRow): SavedSearch => ({
    id: row.id,
    name: row.name,
    search_query: row.search_query,
    filters: row.filters as unknown as FilterOptions,
    category_ids: row.category_ids,
    notification_enabled: row.notification_enabled,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });

  // Fetch saved searches for the current user
  const fetchSavedSearches = async () => {
    if (!user) {
      setSavedSearches([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedData = (data as SavedSearchRow[] || []).map(convertToSavedSearch);
      setSavedSearches(convertedData);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      toast({
        title: "Error",
        description: "Failed to load saved searches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Save a new search
  const saveSearch = async (
    name: string,
    searchQuery: string,
    filters: FilterOptions,
    categoryIds: string[] = [],
    notificationEnabled: boolean = false
  ) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save searches",
        variant: "destructive",
      });
      return false;
    }

    // Check if name already exists
    const existingSearch = savedSearches.find(search => 
      search.name.toLowerCase() === name.toLowerCase()
    );

    if (existingSearch) {
      toast({
        title: "Name already exists",
        description: "Please choose a different name for your search",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name,
          search_query: searchQuery,
          filters: filters as unknown as Json,
          category_ids: categoryIds,
          notification_enabled: notificationEnabled,
        })
        .select()
        .single();

      if (error) throw error;

      const convertedData = convertToSavedSearch(data as SavedSearchRow);
      setSavedSearches(prev => [convertedData, ...prev]);
      toast({
        title: "Search saved",
        description: `"${name}" has been saved to your searches`,
      });
      return true;
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update an existing saved search
  const updateSavedSearch = async (
    id: string,
    updates: Partial<Pick<SavedSearch, 'name' | 'search_query' | 'filters' | 'category_ids' | 'notification_enabled'>>
  ) => {
    if (!user) return false;

    try {
      // Convert filters to Json type for database
      const dbUpdates = {
        ...updates,
        ...(updates.filters && { filters: updates.filters as unknown as Json })
      };

      const { data, error } = await supabase
        .from('saved_searches')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const convertedData = convertToSavedSearch(data as SavedSearchRow);
      setSavedSearches(prev => 
        prev.map(search => search.id === id ? convertedData : search)
      );
      
      toast({
        title: "Search updated",
        description: "Your saved search has been updated",
      });
      return true;
    } catch (error) {
      console.error('Error updating saved search:', error);
      toast({
        title: "Error",
        description: "Failed to update search",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a saved search
  const deleteSavedSearch = async (id: string, name: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedSearches(prev => prev.filter(search => search.id !== id));
      toast({
        title: "Search deleted",
        description: `"${name}" has been removed from your saved searches`,
      });
      return true;
    } catch (error) {
      console.error('Error deleting saved search:', error);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle notification for a saved search
  const toggleNotification = async (id: string, enabled: boolean) => {
    return updateSavedSearch(id, { notification_enabled: enabled });
  };

  useEffect(() => {
    fetchSavedSearches();
  }, [user]);

  return {
    savedSearches,
    loading,
    saveSearch,
    updateSavedSearch,
    deleteSavedSearch,
    toggleNotification,
    refetch: fetchSavedSearches,
  };
};