import AdCard from "./AdCard";

// Mock data for demonstration
const mockAds = [
  {
    id: "1",
    title: "2018 Honda Civic - Excellent Condition",
    price: "$18,500",
    location: "San Francisco, CA",
    timeAgo: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    category: "Vehicles"
  },
  {
    id: "2",
    title: "Modern 2BR Apartment in SOMA",
    price: "$3,200/mo",
    location: "San Francisco, CA",
    timeAgo: "4 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Housing"
  },
  {
    id: "3",
    title: "iPhone 14 Pro Max - Like New",
    price: "$899",
    location: "Oakland, CA",
    timeAgo: "6 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Electronics",
    isLiked: true
  },
  {
    id: "4",
    title: "Vintage Leather Sofa Set",
    price: "$450",
    location: "Berkeley, CA",
    timeAgo: "8 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Furniture"
  },
  {
    id: "5",
    title: "Professional Photography Services",
    price: "$200/session",
    location: "San Jose, CA",
    timeAgo: "12 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isFeatured: true,
    category: "Services"
  },
  {
    id: "6",
    title: "Gaming Setup - Complete Bundle",
    price: "$1,200",
    location: "Fremont, CA",
    timeAgo: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Gaming"
  },
  {
    id: "7",
    title: "Designer Handbag Collection",
    price: "$150-$800",
    location: "Palo Alto, CA",
    timeAgo: "1 day ago",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Clothing"
  },
  {
    id: "8",
    title: "Mountain Bike - Trek 2022",
    price: "$1,800",
    location: "Santa Clara, CA",
    timeAgo: "2 days ago",
    imageUrl: "https://images.unsplash.com/photo-1544191696-15693072e0e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Sports"
  }
];

const AdGrid = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Latest Listings</h2>
            <p className="text-muted-foreground">Discover amazing deals from local sellers</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {mockAds.length} of 25,000+ results
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockAds.map((ad) => (
            <AdCard key={ad.id} {...ad} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Load More Listings
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdGrid;