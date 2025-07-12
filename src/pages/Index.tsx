import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";
import HeroSection from "@/components/HeroSection";
import AdGrid from "@/components/AdGrid";

const Index = () => {
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
