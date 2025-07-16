// SEO utilities for dynamic meta tags and structured data

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

export interface StructuredDataItem {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

export const defaultSEO: SEOData = {
  title: "Classifieds Connect - Buy & Sell Items Online | Local Marketplace",
  description: "Discover amazing deals on electronics, furniture, cars, and more. Post free ads, chat with buyers and sellers instantly. Your trusted local marketplace.",
  keywords: "classifieds, marketplace, buy, sell, local ads, electronics, furniture, cars, real estate, jobs, free ads",
  image: "https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com/icons/icon-512x512.png",
  url: "https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com",
  type: "website"
};

export const updatePageSEO = (seoData: Partial<SEOData>) => {
  const data = { ...defaultSEO, ...seoData };
  
  // Update title
  if (data.title) {
    document.title = data.title;
    updateMetaTag('og:title', data.title);
    updateMetaTag('twitter:title', data.title);
  }
  
  // Update description
  if (data.description) {
    updateMetaTag('description', data.description);
    updateMetaTag('og:description', data.description);
    updateMetaTag('twitter:description', data.description);
  }
  
  // Update keywords
  if (data.keywords) {
    updateMetaTag('keywords', data.keywords);
  }
  
  // Update image
  if (data.image) {
    updateMetaTag('og:image', data.image);
    updateMetaTag('twitter:image', data.image);
  }
  
  // Update URL
  if (data.url) {
    updateMetaTag('og:url', data.url);
    updateMetaTag('twitter:url', data.url);
    updateLinkTag('canonical', data.url);
  }
  
  // Update type
  if (data.type) {
    updateMetaTag('og:type', data.type);
  }
  
  // Microsoft/Bing specific updates
  updateBingMeta(data);
};

// Microsoft/Bing specific meta tag updates
const updateBingMeta = (data: Partial<SEOData>) => {
  // Bing prefers specific meta tags for better indexing
  if (data.title) {
    updateMetaTag('msapplication-TileColor', '#3b82f6');
    updateMetaTag('application-name', data.title);
  }
  
  if (data.description) {
    updateMetaTag('msapplication-tooltip', data.description.substring(0, 100));
  }
  
  // Add Microsoft Clarity if needed (placeholder for user to add their ID)
  if (!document.querySelector('script[src*="clarity.ms"]')) {
    addMicrosoftClarity();
  }
};

// Add Microsoft Clarity tracking (placeholder)
const addMicrosoftClarity = () => {
  // Placeholder for Microsoft Clarity - user needs to add their tracking ID
  const script = document.createElement('script');
  script.innerHTML = `
    // Microsoft Clarity tracking code placeholder
    // Replace 'YOUR_CLARITY_ID' with your actual Clarity tracking ID
    /*
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
    */
  `;
  document.head.appendChild(script);
};

const updateMetaTag = (name: string, content: string) => {
  // Handle property-based meta tags (og:, twitter:)
  const isProperty = name.startsWith('og:') || name.startsWith('twitter:');
  const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  
  let meta = document.querySelector(selector) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    if (isProperty) {
      meta.setAttribute('property', name);
    } else {
      meta.setAttribute('name', name);
    }
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
};

const updateLinkTag = (rel: string, href: string) => {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', href);
};

// Generate structured data for classified ads
export const generateAdStructuredData = (ad: {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency?: string;
  condition?: string;
  location?: string;
  images?: string[];
  category?: string;
  user?: { display_name?: string };
  created_at: string;
}): StructuredDataItem => {
  const baseUrl = "https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/ad/${ad.id}`,
    "name": ad.title,
    "description": ad.description,
    "url": `${baseUrl}/ad/${ad.id}`,
    "image": ad.images?.map(img => img) || [],
    "category": ad.category || "General",
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
};

// Generate structured data for breadcrumbs
export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{
  name: string;
  url: string;
}>): StructuredDataItem => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

// Add structured data to page
export const addStructuredData = (data: StructuredDataItem) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  
  // Remove existing structured data for the same type
  const existing = document.querySelector(`script[type="application/ld+json"]`);
  if (existing && existing.textContent?.includes(`"@type":"${data["@type"]}"`) && data["@type"] !== "WebSite") {
    existing.remove();
  }
  
  document.head.appendChild(script);
};

// Remove structured data
export const removeStructuredData = (type: string) => {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  scripts.forEach(script => {
    if (script.textContent?.includes(`"@type":"${type}"`)) {
      script.remove();
    }
  });
};

// Generate sitemap data (for server-side generation)
export const generateSitemapUrls = (ads: Array<{ id: string; updated_at: string }>) => {
  const baseUrl = "https://b9176124-6ffc-4197-917e-de49c19111ed.lovableproject.com";
  
  const staticUrls = [
    { url: baseUrl, lastmod: new Date().toISOString(), priority: '1.0', changefreq: 'daily' },
    { url: `${baseUrl}/dashboard`, lastmod: new Date().toISOString(), priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/post-ad`, lastmod: new Date().toISOString(), priority: '0.8', changefreq: 'weekly' },
    { url: `${baseUrl}/auth`, lastmod: new Date().toISOString(), priority: '0.6', changefreq: 'monthly' },
    { url: `${baseUrl}/pricing`, lastmod: new Date().toISOString(), priority: '0.7', changefreq: 'monthly' },
    { url: `${baseUrl}/promotions`, lastmod: new Date().toISOString(), priority: '0.7', changefreq: 'weekly' }
  ];
  
  const adUrls = ads.map(ad => ({
    url: `${baseUrl}/ad/${ad.id}`,
    lastmod: ad.updated_at,
    priority: '0.9',
    changefreq: 'weekly'
  }));
  
  return [...staticUrls, ...adUrls];
};

// Generate XML sitemap with Microsoft/Bing optimizations
export const generateXMLSitemap = (urls: Array<{ 
  url: string; 
  lastmod: string; 
  priority: string; 
  changefreq?: string 
}>) => {
  const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">';
  
  const urlElements = urls.map(urlData => {
    return `  <url>
    <loc>${urlData.url}</loc>
    <lastmod>${urlData.lastmod}</lastmod>
    <changefreq>${urlData.changefreq || 'weekly'}</changefreq>
    <priority>${urlData.priority}</priority>
  </url>`;
  }).join('\n');
  
  const urlsetClose = '</urlset>';
  
  return `${xmlDeclaration}\n${urlsetOpen}\n${urlElements}\n${urlsetClose}`;
};

// Bing-specific meta validation
export const validateBingMeta = () => {
  const requiredMeta = [
    'msvalidate.01',
    'description',
    'keywords',
    'og:title',
    'og:description',
    'og:image'
  ];
  
  const missingMeta: string[] = [];
  
  requiredMeta.forEach(metaName => {
    const isProperty = metaName.startsWith('og:');
    const selector = isProperty ? `meta[property="${metaName}"]` : `meta[name="${metaName}"]`;
    
    if (!document.querySelector(selector)) {
      missingMeta.push(metaName);
    }
  });
  
  return {
    isValid: missingMeta.length === 0,
    missingMeta,
    recommendations: generateBingRecommendations(missingMeta)
  };
};

// Generate Bing SEO recommendations
const generateBingRecommendations = (missingMeta: string[]) => {
  const recommendations: string[] = [];
  
  if (missingMeta.includes('msvalidate.01')) {
    recommendations.push('Add Bing Webmaster Tools verification meta tag');
  }
  
  if (missingMeta.includes('description')) {
    recommendations.push('Add meta description (150-160 characters recommended)');
  }
  
  if (missingMeta.includes('keywords')) {
    recommendations.push('Add relevant keywords meta tag');
  }
  
  if (missingMeta.includes('og:title') || missingMeta.includes('og:description')) {
    recommendations.push('Add Open Graph meta tags for better social sharing');
  }
  
  return recommendations;
};