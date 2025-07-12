import { Search, Menu, User, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ClassifiedList
              </h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Beta
              </Badge>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for anything..."
                className="pl-10 pr-4 h-10 bg-muted/50 border-muted focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Location & Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="hidden lg:flex">
              <MapPin className="h-4 w-4 mr-2" />
              San Francisco
            </Button>
            
            <Button variant="hero" size="sm" className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Post Ad
            </Button>
            
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for anything..."
              className="pl-10 pr-4 h-10 bg-muted/50 border-muted"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;