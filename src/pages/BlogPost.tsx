import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, Clock, Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import { useAdSEO } from "@/hooks/useSEO";

// Mock blog posts data (same as Blog.tsx)
const blogPosts = [
  {
    id: "1",
    title: "How to Sell Items Online: A Complete Guide",
    slug: "how-to-sell-items-online-complete-guide",
    excerpt: "Learn the best practices for selling items online, from photography tips to pricing strategies that work.",
    content: `
      <h2>Getting Started with Online Selling</h2>
      <p>Selling items online has become one of the most popular ways to declutter your home and make extra money. Whether you're selling old electronics, furniture, or collectibles, following the right strategies can make all the difference.</p>
      
      <h3>1. Research Your Market</h3>
      <p>Before listing your item, research similar products to understand market demand and pricing. Check completed sales on various platforms to get a realistic price range.</p>
      
      <h3>2. Take Quality Photos</h3>
      <p>Photos are crucial for online sales. Use natural lighting, clean backgrounds, and show the item from multiple angles. Include close-ups of any flaws or wear.</p>
      
      <h3>3. Write Compelling Descriptions</h3>
      <p>Be honest and detailed in your descriptions. Include dimensions, condition, brand, model, and any relevant specifications. Use keywords that buyers might search for.</p>
      
      <h3>4. Price Competitively</h3>
      <p>Research similar items and price yours competitively. Consider the item's condition, age, and market demand. Don't forget to factor in platform fees.</p>
      
      <h3>5. Choose the Right Platform</h3>
      <p>Different platforms work better for different types of items. Electronics might do well on tech-focused sites, while handmade items might perform better on craft platforms.</p>
      
      <h2>Best Practices for Success</h2>
      <ul>
        <li>Respond quickly to inquiries</li>
        <li>Be flexible with meeting arrangements</li>
        <li>Package items carefully for shipping</li>
        <li>Keep detailed records for tax purposes</li>
        <li>Build a positive reputation through good customer service</li>
      </ul>
    `,
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
    content: `
      <h2>The Importance of Great Product Photos</h2>
      <p>In online marketplaces, your photos are often the first and most important impression you make on potential buyers. Great photos can mean the difference between a quick sale and a listing that sits unsold for months.</p>
      
      <h3>Essential Equipment</h3>
      <p>You don't need expensive equipment to take great product photos. Here's what you need:</p>
      <ul>
        <li>A smartphone with a decent camera (most modern phones work great)</li>
        <li>Good lighting (natural light is often best)</li>
        <li>A clean, neutral background</li>
        <li>A tripod or stable surface</li>
      </ul>
      
      <h3>Lighting Techniques</h3>
      <p>Natural light from a window provides the most flattering illumination for most products. Avoid direct sunlight which can create harsh shadows. Overcast days provide excellent, even lighting.</p>
      
      <h3>Composition Tips</h3>
      <ul>
        <li>Fill the frame with your product</li>
        <li>Use the rule of thirds for more interesting compositions</li>
        <li>Show scale by including familiar objects</li>
        <li>Take photos from multiple angles</li>
        <li>Include detail shots of important features</li>
      </ul>
      
      <h3>Post-Processing</h3>
      <p>Basic editing can improve your photos significantly. Adjust brightness, contrast, and saturation. Crop for better composition. Remove distracting elements from the background.</p>
    `,
    author: "Marketing Team",
    publishedAt: "2024-01-10",
    category: "Photography",
    tags: ["photography", "products", "marketing", "visual"],
    image: "photo-1486312338219-ce68d2c6f44d",
    readTime: "3 min read"
  }
];

const BlogPost = () => {
  const { slug } = useParams();
  
  const post = blogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-4">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Use SEO hook with blog post data
  useAdSEO({
    id: post.id,
    title: post.title,
    description: post.excerpt,
    price: null,
    currency: null,
    condition: null,
    location: null,
    images: [{
      image_url: `https://images.unsplash.com/${post.image}?auto=format&fit=crop&w=1200&q=80`
    }],
    categories: {
      name: post.category
    },
    user: {
      display_name: post.author
    },
    created_at: post.publishedAt
  });

  const shareUrl = window.location.href;
  const shareTitle = post.title;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/blog">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">{post.category}</Badge>
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
            
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
              </div>
              
              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`, '_blank')}
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank')}
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-8">
            <img
              src={`https://images.unsplash.com/${post.image}?auto=format&fit=crop&w=1200&q=80`}
              alt={post.title}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Article Content */}
          <Card>
            <CardContent className="prose prose-lg max-w-none pt-6">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </CardContent>
          </Card>

          {/* Tags */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Tags:</h3>
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;