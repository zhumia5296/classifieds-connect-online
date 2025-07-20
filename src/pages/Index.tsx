import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";
import HeroSection from "@/components/HeroSection";
import AdGrid from "@/components/AdGrid";
import LocationBasedSuggestions from "@/components/LocationBasedSuggestions";
import NearbyAlertPrompt from "@/components/NearbyAlertPrompt";
import ComparisonBar from "@/components/ComparisonBar";
import UnifiedSearchBar from "@/components/mobile/UnifiedSearchBar";
import CompactCategoryNav from "@/components/mobile/CompactCategoryNav";
import MobileAdGrid from "@/components/mobile/MobileAdGrid";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { useAuth } from "@/hooks/useAuth";
import { useSEO, useCategorySEO, useSearchSEO } from "@/hooks/useSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCategoryFilter } from "@/hooks/useCategoryFilter";
import { useState, useEffect } from "react";
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { loading, user } = useAuth();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { selectedCategory, setSelectedCategory } = useCategoryFilter();
  const [categories, setCategories] = useState([]);
  const [ads, setAds] = useState([]);
  const [adLoading, setAdLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  // Fetch categories for mobile navigation
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch ads with mobile optimizations
  useEffect(() => {
    setPage(0);
    setAds([]);
    fetchAds();
  }, [selectedCategory, search]);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon, parent_id')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (error) throw error;

      // Get ad counts
      const { data: adCounts, error: countError } = await supabase
        .from('ads')
        .select('category_id')
        .eq('is_active', true)
        .eq('status', 'active');

      if (countError) throw countError;

      const countMap = {};
      adCounts?.forEach(ad => {
        countMap[ad.category_id] = (countMap[ad.category_id] || 0) + 1;
      });

      const categoriesWithCounts = categoriesData?.map(cat => ({
        ...cat,
        ad_count: countMap[cat.id] || 0
      })) || [];

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAds = async (pageNum = 0, append = false) => {
    try {
      if (!append) setAdLoading(true);
      else setLoadingMore(true);

      const from = pageNum * 12;
      const to = from + 11;

      let query = supabase
        .from('ads')
        .select(`
          id, title, price, currency, location, latitude, longitude,
          condition, created_at, is_featured, featured_until, user_id,
          categories(name),
          ad_images(image_url, is_primary),
          saved_ads(id)
        `)
        .eq('is_active', true)
        .eq('status', 'active');

      if (search?.trim()) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (user) {
        query = query.eq('saved_ads.user_id', user.id);
      }

      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      const newAds = data || [];
      
      if (append) {
        setAds(prev => [...prev, ...newAds]);
      } else {
        setAds(newAds);
      }

      setHasMore(newAds.length === 12);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setAdLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAds(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(0);
    setAds([]);
    fetchAds();
  };

  const handleToggleSave = async (adId) => {
    if (!user) return;

    try {
      const ad = ads.find(a => a.id === adId);
      const isSaved = ad?.saved_ads.length > 0;

      if (isSaved) {
        await supabase
          .from('saved_ads')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', adId);

        setAds(prev => prev.map(ad => 
          ad.id === adId ? { ...ad, saved_ads: [] } : ad
        ));
      } else {
        await supabase
          .from('saved_ads')
          .insert({ user_id: user.id, ad_id: adId });

        setAds(prev => prev.map(ad => 
          ad.id === adId ? { ...ad, saved_ads: [{ id: 'temp' }] } : ad
        ));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };
  
  // Dynamic SEO based on URL parameters
  if (search) {
    useSearchSEO(search);
  } else if (category) {
    useCategorySEO(category);
  } else {
    // Default homepage SEO
    useSEO({
      title: "Classifieds Connect - Buy & Sell Items Online | Local Marketplace",
      description: "Discover amazing deals on electronics, furniture, cars, and more. Post free ads, chat with buyers and sellers instantly. Your trusted local marketplace.",
      keywords: "classifieds, marketplace, buy, sell, local ads, electronics, furniture, cars, real estate, jobs, free ads"
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile-first responsive layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <UnifiedSearchBar 
          onSearch={(query, location) => {
            // Handle mobile search with location context
            const searchParams = new URLSearchParams();
            if (query) searchParams.append('search', query);
            if (location) searchParams.append('location', location);
            if (selectedCategory) searchParams.append('category', selectedCategory);
            
            window.location.href = `/search?${searchParams.toString()}`;
          }}
          onFilterToggle={() => {
            // TODO: Implement filter modal
            console.log('Toggle filters');
          }}
          defaultQuery={search || ''}
        />
        <CompactCategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        <PullToRefresh onRefresh={handleRefresh} refreshing={adLoading}>
          <MobileAdGrid
            ads={ads}
            loading={adLoading}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            onRefresh={handleRefresh}
            onToggleSave={handleToggleSave}
          />
        </PullToRefresh>
        <ComparisonBar />
      </div>
    );
  }

  // Desktop layout (existing)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CategoryNav />
      <HeroSection />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <AdGrid />
          </div>
          <div className="space-y-6">
            <NearbyAlertPrompt />
            <LocationBasedSuggestions />
          </div>
        </div>
      </div>
      <ComparisonBar />
    </div>
  );
};

export default Index;
