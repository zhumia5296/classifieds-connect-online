import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { subscription, checkSubscription, loading } = useSubscription();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Delay subscription check to allow Stripe to process
    const timeoutId = setTimeout(() => {
      checkSubscription();
      setHasChecked(true);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [checkSubscription]);

  // Auto-refresh subscription status every 5 seconds for up to 30 seconds
  useEffect(() => {
    if (!hasChecked || subscription.subscribed) return;

    let attempts = 0;
    const maxAttempts = 6; // 30 seconds total

    const intervalId = setInterval(() => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        return;
      }
      checkSubscription();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [hasChecked, subscription.subscribed, checkSubscription]);

  const getTierDisplayName = (tier: string | null) => {
    if (!tier) return 'Premium';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getTierFeatures = (tier: string | null) => {
    const features = {
      basic: [
        'Post up to 10 ads per month',
        'Basic search filters',
        'Email notifications',
        'Standard support'
      ],
      premium: [
        'Unlimited ad posting',
        'Priority listing placement',
        'Featured ad promotions',
        'Advanced analytics'
      ],
      enterprise: [
        'All Premium features',
        'Bulk ad management',
        'API access',
        'Dedicated support'
      ]
    };

    return features[tier as keyof typeof features] || features.premium;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
            Subscription Successful!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Welcome to your new premium experience
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading && !subscription.subscribed ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Processing your subscription...
              </p>
            </div>
          ) : subscription.subscribed ? (
            <>
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">
                    {getTierDisplayName(subscription.subscription_tier)} Plan Active
                  </h3>
                </div>
                
                {subscription.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    Your subscription renews on{" "}
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">You now have access to:</h4>
                <ul className="space-y-2">
                  {getTierFeatures(subscription.subscription_tier).map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1">
                  <Link to="/dashboard">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/post-ad">
                    Create Your First Premium Ad
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                We're still processing your subscription. This may take a few moments.
              </p>
              <Button 
                variant="outline" 
                onClick={checkSubscription}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check Status Again'}
              </Button>
            </div>
          )}

          {sessionId && (
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId.slice(0, 20)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;