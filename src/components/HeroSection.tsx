import { Search, MapPin, TrendingUp, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const stats = [
    { label: t('hero.stats.total_ads'), value: "25,000+" },
    { label: t('hero.stats.active_users'), value: "50,000+" },
    { label: t('hero.stats.categories'), value: "500+" },
  ];

  return (
    <section className="relative bg-gradient-hero text-primary-foreground py-16 md:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
      
      <div className="container mx-auto px-4 lg:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-white/20">
            <TrendingUp className="h-3 w-3 mr-1" />
            #1 Local Marketplace
          </Badge>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')}
            <span className="block text-primary-glow">Right in Your Neighborhood</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-12 text-primary-foreground/80 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          
          {/* Search Bar */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-12 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder={t('hero.search_placeholder')}
                  className="pl-12 h-12 bg-background text-foreground border-0 text-lg"
                />
              </div>
              <div className="relative md:w-48">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder={t('hero.location_placeholder')}
                  className="pl-12 h-12 bg-background text-foreground border-0"
                />
              </div>
              <Button variant="hero" size="xl" className="h-12 bg-white text-primary hover:bg-white/90">
                {t('hero.search_button')}
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="h-12 border-white/20 text-white hover:bg-white/10"
                onClick={() => navigate('/map')}
              >
                <Map className="h-5 w-5 mr-2" />
                View on Map
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 text-primary-glow">
                  {stat.value}
                </div>
                <div className="text-primary-foreground/80 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;