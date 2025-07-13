import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";
import HeroSection from "@/components/HeroSection";
import AdGrid from "@/components/AdGrid";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CategoryNav />
      <HeroSection />
      <AdGrid />
    </div>
  );
};

export default Index;
