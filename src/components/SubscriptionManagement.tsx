import { Crown, Calendar, CreditCard, ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { 
    subscription, 
    loading, 
    error, 
    checkSubscription, 
    openCustomerPortal,
    isBasic,
    isPremium,
    isEnterprise
  } = useSubscription();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            Please sign in to manage your subscription
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPlanDisplayName = (tier: string | null) => {
    if (!tier) return 'Free';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getPlanPrice = (tier: string | null) => {
    const prices = {
      basic: '$9.99',
      premium: '$19.99',
      enterprise: '$49.99'
    };
    return prices[tier as keyof typeof prices] || 'Free';
  };

  const getPlanFeatures = (tier: string | null) => {
    const features = {
      basic: ['10 ads per month', 'Basic support', 'Email notifications'],
      premium: ['Unlimited ads', 'Priority placement', 'Advanced analytics'],
      enterprise: ['All Premium features', 'API access', 'Dedicated support']
    };
    return features[tier as keyof typeof features] || ['Limited features'];
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscription}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Plan Status */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {getPlanDisplayName(subscription.subscription_tier)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getPlanPrice(subscription.subscription_tier)}/month
                  </p>
                </div>
              </div>
              <Badge 
                variant={subscription.subscribed ? "default" : "secondary"}
                className="text-xs"
              >
                {subscription.subscribed ? "Active" : "Free Plan"}
              </Badge>
            </div>

            {subscription.subscribed && subscription.subscription_end && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                <span>
                  Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Plan Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {getPlanFeatures(subscription.subscription_tier).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {subscription.subscribed ? (
              <>
                <Button 
                  onClick={openCustomerPortal}
                  disabled={loading}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="flex-1"
                >
                  <Link to="/pricing">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Change Plan
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="flex-1">
                <Link to="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Link>
              </Button>
            )}
          </div>

          {/* Plan Comparison */}
          {!subscription.subscribed && (
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Why upgrade?</h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg text-center">
                  <div className="font-medium text-primary">Basic</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    10 ads/month
                  </div>
                </div>
                <div className="p-3 border rounded-lg text-center border-primary">
                  <div className="font-medium text-primary">Premium</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Unlimited ads
                  </div>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <div className="font-medium text-primary">Enterprise</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    API access
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Benefits */}
      {subscription.subscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Your Premium Benefits</CardTitle>
            <CardDescription>
              Features available with your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Unlimited ad posting</span>
              </div>
              {(isPremium || isEnterprise) && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Priority placement</span>
                </div>
              )}
              {isEnterprise && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm">API access</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">Advanced analytics</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagement;