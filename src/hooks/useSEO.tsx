import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  updatePageSEO, 
  addStructuredData, 
  removeStructuredData, 
  generateBreadcrumbStructuredData,
  type SEOData, 
  type StructuredDataItem 
} from '@/lib/seo';

interface UseSEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  structuredData?: StructuredDataItem;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const useSEO = (options: UseSEOOptions = {}) => {
  const location = useLocation();
  
  useEffect(() => {
    const baseUrl = "https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com";
    const currentUrl = `${baseUrl}${location.pathname}${location.search}`;
    
    // Update basic SEO data
    const seoData: Partial<SEOData> = {
      url: currentUrl,
      ...options
    };
    
    updatePageSEO(seoData);
    
    // Add structured data if provided
    if (options.structuredData) {
      addStructuredData(options.structuredData);
    }
    
    // Add breadcrumb structured data if provided
    if (options.breadcrumbs && options.breadcrumbs.length > 1) {
      const breadcrumbData = generateBreadcrumbStructuredData(
        options.breadcrumbs.map(crumb => ({
          ...crumb,
          url: crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
        }))
      );
      addStructuredData(breadcrumbData);
    }
    
    // Cleanup function to remove structured data when component unmounts
    return () => {
      if (options.structuredData) {
        removeStructuredData(options.structuredData["@type"]);
      }
      if (options.breadcrumbs) {
        removeStructuredData("BreadcrumbList");
      }
    };
  }, [location.pathname, location.search, options.title, options.description, options.structuredData]);
};

// Hook for ad pages
export const useAdSEO = (ad: {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  condition?: string;
  location?: string;
  images?: Array<{ image_url: string }>;
  categories?: { name: string };
  user?: { display_name?: string };
  created_at: string;
} | null) => {
  // Always call useSEO to maintain consistent hook calls
  // If ad is null, use default values
  const adImages = ad?.images?.map(img => img.image_url) || [];
  const primaryImage = adImages[0] || "https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com/icons/icon-512x512.png";
  
  let structuredData: StructuredDataItem | undefined;
  let breadcrumbs: Array<{ name: string; url: string }> | undefined;
  let title = "Classifieds Connect";
  let description = "Buy and sell items in your local area";
  let keywords = "classifieds, marketplace, buy, sell";
  
  if (ad && ad.description) {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com/ad/${ad.id}`,
      "name": ad.title,
      "description": ad.description,
      "url": `https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com/ad/${ad.id}`,
      "image": adImages,
      "category": ad.categories?.name || "General",
      "brand": {
        "@type": "Organization",
        "name": "Classifieds Connect"
      },
      "offers": {
        "@type": "Offer",
        "price": ad.price || 0,
        "priceCurrency": ad.currency || "USD",
        "itemCondition": `https://schema.org/${ad.condition === 'new' ? 'NewCondition' : 'UsedCondition'}`,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Person",
          "name": ad.user?.display_name || "Anonymous"
        },
        "availableAtOrFrom": {
          "@type": "Place",
          "address": ad.location || "Location not specified"
        }
      },
      "datePublished": ad.created_at,
      "identifier": ad.id
    };
    
    breadcrumbs = [
      { name: "Home", url: "/" },
      { name: ad.categories?.name || "General", url: `/?category=${ad.categories?.name || 'general'}` },
      { name: ad.title, url: `/ad/${ad.id}` }
    ];
    
    const priceText = ad.price ? ` - $${ad.price}` : '';
    const locationText = ad.location ? ` in ${ad.location}` : '';
    
    title = `${ad.title}${priceText} | Classifieds Connect`;
    description = `${ad.description.substring(0, 150)}...${locationText} | Buy on Classifieds Connect`;
    keywords = `${ad.title}, ${ad.categories?.name || 'classified'}, buy, sell, marketplace${ad.location ? `, ${ad.location}` : ''}`;
  }
  
  useSEO({
    title,
    description,
    keywords,
    image: primaryImage,
    structuredData,
    breadcrumbs
  });
};

// Hook for category pages
export const useCategorySEO = (category: string, adCount?: number) => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: category, url: `/?category=${category}` }
  ];
  
  const countText = adCount ? ` (${adCount} ads)` : '';
  
  useSEO({
    title: `${category} Classifieds${countText} | Classifieds Connect`,
    description: `Browse ${category.toLowerCase()} ads on Classifieds Connect. Find great deals on ${category.toLowerCase()} items near you.`,
    keywords: `${category}, classifieds, marketplace, buy, sell, ${category.toLowerCase()} ads`,
    breadcrumbs
  });
};

// Hook for search results
export const useSearchSEO = (query: string, resultCount?: number) => {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: `Search: ${query}`, url: `/?search=${encodeURIComponent(query)}` }
  ];
  
  const countText = resultCount !== undefined ? ` (${resultCount} results)` : '';
  
  useSEO({
    title: `"${query}" Search Results${countText} | Classifieds Connect`,
    description: `Search results for "${query}" on Classifieds Connect. Find what you're looking for in our local marketplace.`,
    keywords: `${query}, search, classifieds, marketplace, buy, sell`,
    breadcrumbs
  });
};