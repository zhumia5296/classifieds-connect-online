import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";
import HeroSection from "@/components/HeroSection";
import AdGrid from "@/components/AdGrid";
import { useAuth } from "@/hooks/useAuth";
import { useSEO, useCategorySEO, useSearchSEO } from "@/hooks/useSEO";
import { CategoryProvider } from "@/hooks/useCategoryFilter";

const Index = () => {
  const { loading } = useAuth();
  const [searchParams] = useSearchParams();
  
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  
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

  return (
    <CategoryProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <CategoryNav />
        <HeroSection />
        <AdGrid />
      </div>
    </CategoryProvider>
  );
};

export default Index;
