import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Home, 
  Briefcase, 
  Smartphone, 
  Sofa, 
  Shirt, 
  Gamepad2, 
  GraduationCap,
  Heart,
  Wrench
} from "lucide-react";

const categories = [
  { name: "All", icon: null, count: "12.5k" },
  { name: "Vehicles", icon: Car, count: "2.1k" },
  { name: "Housing", icon: Home, count: "1.8k" },
  { name: "Jobs", icon: Briefcase, count: "950" },
  { name: "Electronics", icon: Smartphone, count: "3.2k" },
  { name: "Furniture", icon: Sofa, count: "1.4k" },
  { name: "Clothing", icon: Shirt, count: "890" },
  { name: "Gaming", icon: Gamepad2, count: "560" },
  { name: "Services", icon: Wrench, count: "1.1k" },
  { name: "Community", icon: Heart, count: "420" },
  { name: "Education", icon: GraduationCap, count: "280" },
];

const CategoryNav = () => {
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            const isActive = index === 0; // "All" is active by default
            
            return (
              <Button
                key={category.name}
                variant={isActive ? "category" : "ghost"}
                size="sm"
                className={`flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                  isActive ? "shadow-card" : "hover:bg-muted/50"
                }`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                <span className="font-medium">{category.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${isActive ? "bg-marketplace-category-foreground/10" : ""}`}
                >
                  {category.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryNav;