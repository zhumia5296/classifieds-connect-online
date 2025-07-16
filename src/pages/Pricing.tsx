import { Check, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Pricing = () => {
  const { user } = useAuth();
  const { subscription, createCheckout, loading, hasFeatureAccess } = useSubscription();

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      description: 'Perfect for casual sellers',
      icon: <Star className="h-6 w-6" />,
      features: [
        'Post up to 10 ads per month',
        'Basic search filters',
        'Email notifications',
        'Standard support',
        'Basic analytics'
      ],
      highlighted: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      description: 'Ideal for active sellers',
      icon: <Crown className="h-6 w-6" />,
      features: [
        'Unlimited ad posting',
        'Priority listing placement',
        'Advanced search filters',
        'Real-time notifications',
        'Featured ad promotions',
        'Detailed analytics',
        'Priority support'
      ],
      highlighted: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$49.99',
      description: 'For serious businesses',
      icon: <Zap className="h-6 w-6" />,
      features: [
        'Everything in Premium',
        'Bulk ad management',
        'Advanced analytics dashboard',
        'Custom branding options',
        'API access',
        'Dedicated account manager',
        'White-label solutions'
      ],
      highlighted: false
    }
  ];

  const handleSubscribe = (planId: string) => {
    if (!user) {
      // Redirect to auth page
      window.location.href = '/auth';
      return;
    }
    createCheckout(planId as 'basic' | 'premium' | 'enterprise');
  };

  const getCurrentPlanBadge = (planId: string) => {
    if (subscription.subscribed && subscription.subscription_tier === planId) {
      return (
        <Badge variant="default" className="ml-2">
          Current Plan
        </Badge>
      );
    }
    return null;
  };

  const getButtonText = (planId: string) => {
    if (!user) return 'Sign Up to Subscribe';
    if (subscription.subscribed && subscription.subscription_tier === planId) {
      return 'Current Plan';
    }
    if (subscription.subscribed) {
      return hasFeatureAccess(planId as any) ? 'Downgrade' : 'Upgrade';
    }
    return 'Subscribe Now';
  };

  const isButtonDisabled = (planId: string) => {
    return loading || (subscription.subscribed && subscription.subscription_tier === planId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features and boost your selling potential with our subscription plans
          </p>
          
          {subscription.subscribed && (
            <div className="mt-6 p-4 bg-primary/10 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                Currently subscribed to{" "}
                <span className="font-semibold capitalize">
                  {subscription.subscription_tier}
                </span>{" "}
                plan
              </p>
              {subscription.subscription_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews on{" "}
                  {new Date(subscription.subscription_end).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-transform hover:scale-105 ${
                plan.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {plan.icon}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  {getCurrentPlanBadge(plan.id)}
                </div>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                <div className="text-4xl font-bold text-primary mt-4">
                  {plan.price}
                  <span className="text-lg text-muted-foreground font-normal">
                    /month
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isButtonDisabled(plan.id)}
                >
                  {getButtonText(plan.id)}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          {user && subscription.subscribed && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Need to manage your subscription?
              </p>
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </Link>
            </div>
          )}
          {!user && (
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pricing;