import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, User, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

// Mock blog posts data
const blogPosts = [
  {
    id: "1",
    title: "How to Sell Items Online: A Complete Guide",
    slug: "how-to-sell-items-online-complete-guide",
    excerpt: "Learn the best practices for selling items online, from photography tips to pricing strategies that work.",
    content: `This comprehensive guide covers everything you need to know about selling items online successfully...`,
    author: "Classifieds Team",
    publishedAt: "2024-01-15",
    category: "Selling Tips",
    tags: ["selling", "tips", "online", "marketplace"],
    image: "photo-1498050108023-c5249f4df085",
    readTime: "5 min read"
  },
  {
    id: "2",
    title: "Photography Tips for Better Product Listings",
    slug: "photography-tips-better-product-listings",
    excerpt: "Professional photography techniques to make your products stand out and sell faster.",
    content: `Great photos are crucial for online sales. Here's how to take professional-looking product photos...`,
    author: "Marketing Team",
    publishedAt: "2024-01-10",
    category: "Photography",
    tags: ["photography", "products", "marketing", "visual"],
    image: "photo-1486312338219-ce68d2c6f44d",
    readTime: "3 min read"
  },
  {
    id: "3",
    title: "Building Trust in Online Marketplaces",
    slug: "building-trust-online-marketplaces",
    excerpt: "How to establish credibility and build trust with buyers in online marketplaces.",
    content: `Trust is the foundation of successful online transactions. Learn how to build and maintain it...`,
    author: "Safety Team",
    publishedAt: "2024-01-05",
    category: "Safety",
    tags: ["trust", "safety", "credibility", "buyers"],
    image: "photo-1581091226825-a6a2a5aee158",
    readTime: "4 min read"
  },
  {
    id: "4",
    title: "The Future of Digital Marketplaces",
    slug: "future-digital-marketplaces",
    excerpt: "Exploring trends and innovations shaping the future of online buying and selling.",
    content: `Digital marketplaces are evolving rapidly. Here are the key trends to watch...`,
    author: "Tech Team",
    publishedAt: "2024-01-01",
    category: "Technology",
    tags: ["future", "technology", "trends", "innovation"],
    image: "photo-1461749280684-dccba630e2f6",
    readTime: "6 min read"
  }
];

const categories = ["All", "Selling Tips", "Photography", "Safety", "Technology"];

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useSEO({
    title: "Blog - Tips, Guides & Insights | Classifieds Connect",
    description: "Discover expert tips, guides, and insights about online selling, buying, and marketplace best practices. Stay updated with the latest trends.",
    keywords: "marketplace blog, selling tips, buying guide, online marketplace, e-commerce tips"
  });

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog & Insights</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert tips, guides, and insights to help you succeed in online marketplaces
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={`https://images.unsplash.com/${post.image}?auto=format&fit=crop&w=400&q=80`}
                  alt={post.title}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/blog/${post.slug}`}>
                    <Button variant="ghost" size="sm">
                      Read More <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;