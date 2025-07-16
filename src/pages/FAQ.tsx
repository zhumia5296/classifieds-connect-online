import Navbar from "@/components/Navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, HelpCircle, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");

  useSEO({
    title: "FAQ - Frequently Asked Questions | Classifieds Connect",
    description: "Find answers to common questions about buying, selling, account management, safety, and payment options on Classifieds Connect.",
    keywords: "FAQ, help, support, buying guide, selling guide, account help, payment, safety"
  });

  const faqCategories = [
    {
      title: "Getting Started",
      icon: HelpCircle,
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign Up' button and follow the registration process. You can sign up with your email address or use social login options. Verification may be required for certain features."
        },
        {
          question: "Is it free to use the platform?",
          answer: "Yes, basic features like posting ads and browsing listings are completely free. We offer premium features like featured listings and advanced analytics for a small fee."
        },
        {
          question: "How do I post my first listing?",
          answer: "After creating an account, click 'Post Ad' in the navigation menu. Fill out the listing form with details, upload photos, and publish your ad. Make sure to follow our posting guidelines."
        }
      ]
    },
    {
      title: "Buying & Selling",
      icon: MessageCircle,
      faqs: [
        {
          question: "How do I contact a seller?",
          answer: "Click the 'Contact Seller' button on any listing to send a message. You can also call or email if the seller has provided contact information."
        },
        {
          question: "What payment methods are accepted?",
          answer: "Payment methods vary by seller. Common options include cash, bank transfer, PayPal, and our secure payment system. Always verify payment methods before meeting."
        },
        {
          question: "How do I negotiate prices?",
          answer: "Use our messaging system to communicate with sellers about pricing. Be respectful and reasonable in your offers. Many sellers are open to negotiation."
        },
        {
          question: "What should I do if an item is damaged?",
          answer: "Contact the seller immediately to discuss the issue. If you used our payment system, you may be eligible for buyer protection. Document any damage with photos."
        }
      ]
    },
    {
      title: "Safety & Security",
      icon: Phone,
      faqs: [
        {
          question: "How do I stay safe when meeting buyers/sellers?",
          answer: "Always meet in public places, bring a friend if possible, trust your instincts, and verify the person's identity. Use our safety guidelines for secure transactions."
        },
        {
          question: "How do I report suspicious activity?",
          answer: "Use the 'Report' button on listings or profiles to flag suspicious behavior. You can also contact our support team directly with concerns."
        },
        {
          question: "What is user verification?",
          answer: "Verified users have confirmed their identity through our verification process. Look for the verification badge to help ensure you're dealing with legitimate users."
        },
        {
          question: "How do you protect my personal information?",
          answer: "We use encryption and secure protocols to protect your data. We never share personal information without your consent. Read our privacy policy for full details."
        }
      ]
    },
    {
      title: "Account Management",
      icon: Mail,
      faqs: [
        {
          question: "How do I edit my profile?",
          answer: "Go to Settings > Profile to update your information, profile picture, and contact preferences. Keep your profile current for better trust with other users."
        },
        {
          question: "How do I change my password?",
          answer: "Visit Settings > Security to change your password. We recommend using a strong, unique password and enabling two-factor authentication."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account in Settings > Account. Note that this action is permanent and will remove all your listings and data."
        },
        {
          question: "How do I manage my notifications?",
          answer: "Customize your notification preferences in Settings > Notifications. You can control email, push, and in-app notifications for different types of activities."
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find answers to common questions about using our platform
          </p>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg py-6"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No FAQ items found matching your search.</p>
              <Button onClick={() => setSearchQuery("")}>Clear Search</Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredFAQs.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <category.icon className="h-6 w-6 text-primary" />
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                    </div>
                    <CardDescription>
                      {category.faqs.length} question{category.faqs.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.faqs.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-muted-foreground mb-8">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Get instant help from our support team</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Start Chat</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle>Email Support</CardTitle>
                <CardDescription>Send us a detailed message</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:support@classifiedsconnect.com">
                    Contact Support
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              You can also check out our comprehensive guides and tutorials
            </p>
            <Link to="/blog">
              <Button variant="outline">
                Visit Our Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;