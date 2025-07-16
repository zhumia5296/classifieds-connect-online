import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, Award, TrendingUp, MessageCircle, Shield, Globe, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const About = () => {
  useSEO({
    title: "About Us - Connecting Communities | Classifieds Connect",
    description: "Learn about Classifieds Connect's mission to create safe, efficient, and user-friendly online marketplaces that bring communities together.",
    keywords: "about us, marketplace platform, online classifieds, community, mission, values"
  });

  const stats = [
    { icon: Users, label: "Active Users", value: "50K+", description: "Growing community" },
    { icon: TrendingUp, label: "Listings Posted", value: "200K+", description: "Items sold" },
    { icon: MessageCircle, label: "Messages Sent", value: "1M+", description: "Conversations" },
    { icon: Shield, label: "Safe Transactions", value: "99.9%", description: "Security rate" }
  ];

  const values = [
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making buying and selling accessible to everyone, everywhere."
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Building a secure platform where users can transact with confidence."
    },
    {
      icon: Heart,
      title: "Community",
      description: "Fostering connections and supporting local communities."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Continuously improving our platform and user experience."
    }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-founder",
      image: "photo-1649972904349-6e44c42644a7",
      bio: "Former e-commerce executive with 10+ years building marketplace platforms."
    },
    {
      name: "Michael Rodriguez",
      role: "CTO & Co-founder", 
      image: "photo-1461749280684-dccba630e2f6",
      bio: "Full-stack engineer passionate about scalable systems and user experience."
    },
    {
      name: "Emma Thompson",
      role: "Head of Product",
      image: "photo-1581091226825-a6a2a5aee158",
      bio: "Product strategist focused on creating intuitive user experiences."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Connecting Communities Through
            <span className="text-primary"> Trusted Commerce</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            We're building the future of online marketplaces - a platform where buying and selling 
            is safe, simple, and brings communities together.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg">Join Our Community</Button>
            </Link>
            <Link to="/blog">
              <Button variant="outline" size="lg">Read Our Story</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <stat.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                  <CardTitle className="text-3xl font-bold">{stat.value}</CardTitle>
                  <CardDescription className="font-semibold">{stat.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              To create the world's most trusted and user-friendly marketplace platform
            </p>
          </div>
          
          <Card className="mb-12">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Building Trust in Digital Commerce</h3>
                  <p className="text-muted-foreground mb-4">
                    We believe that online marketplaces should be safe, transparent, and accessible to everyone. 
                    Our platform combines cutting-edge technology with human-centered design to create 
                    experiences that users love and trust.
                  </p>
                  <p className="text-muted-foreground">
                    From advanced verification systems to intuitive messaging tools, every feature is 
                    designed with security and usability in mind.
                  </p>
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=600&q=80"
                    alt="Modern workspace"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center h-full">
                <CardHeader>
                  <value.icon className="h-12 w-12 mx-auto text-primary mb-4" />
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground">
              The passionate people building the future of online marketplaces
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-muted">
                    <img
                      src={`https://images.unsplash.com/${member.image}?auto=format&fit=crop&w=200&q=80`}
                      alt={member.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardTitle>{member.name}</CardTitle>
                  <Badge variant="secondary">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Community?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start buying, selling, and connecting with people in your area today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button variant="secondary" size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Explore Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;