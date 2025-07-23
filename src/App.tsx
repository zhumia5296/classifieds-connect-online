import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import "./lib/i18n"; // Initialize i18n
import { CategoryProvider } from "@/hooks/useCategoryFilter";
import { ComparisonProvider } from "@/hooks/useComparison";
import { InstallPrompt } from "@/hooks/usePWA";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PostAd from "./pages/PostAd";
import AdDetail from "./pages/AdDetail";
import Messages from "./pages/Messages";
import RealtimeDemo from "./pages/RealtimeDemo";
import Analytics from "./pages/Analytics";
import MobileOptimization from "./pages/MobileOptimization";
import Admin from "./pages/Admin";
import Watchlists from "./pages/Watchlists";
import BulkAdManagement from "./pages/BulkAdManagement";
import CategoryPage from "./pages/CategoryPage";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";
import SearchResults from "./pages/SearchResults";
import { ActivityFeed } from "./pages/ActivityFeed";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Orders from "./pages/Orders";
import { OrderDetails } from "./components/OrderDetails";
import Inventory from "./pages/Inventory";
import SafeMeetup from "./pages/SafeMeetup";
import SafetyCenter from "./pages/SafetyCenter";
import NearbyAlerts from "./pages/NearbyAlerts";
import SearchAlerts from "./pages/SearchAlerts";
import MapView from "./pages/MapView";
import DeliveryNetwork from "./pages/DeliveryNetwork";
import LiveTrackingMap from "./pages/LiveTrackingMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <CategoryProvider>
          <ComparisonProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout><Index /></Layout>} />
                <Route path="/auth" element={<Layout><Auth /></Layout>} />
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/post-ad" element={<Layout><PostAd /></Layout>} />
                <Route path="/ad/:id" element={<Layout><AdDetail /></Layout>} />
                <Route path="/compare" element={<Layout><Compare /></Layout>} />
                <Route path="/messages" element={<Layout><Messages /></Layout>} />
                <Route path="/realtime-demo" element={<Layout><RealtimeDemo /></Layout>} />
                <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
                <Route path="/mobile" element={<Layout><MobileOptimization /></Layout>} />
                <Route path="/admin" element={<Layout><Admin /></Layout>} />
                <Route path="/watchlists" element={<Layout><Watchlists /></Layout>} />
                <Route path="/bulk-management" element={<Layout><BulkAdManagement /></Layout>} />
                <Route path="/category/:slug" element={<Layout><CategoryPage /></Layout>} />
                <Route path="/profile" element={<Layout><Profile /></Layout>} />
                <Route path="/user/:id" element={<Layout><UserProfile /></Layout>} />
                <Route path="/settings" element={<Layout><Settings /></Layout>} />
                <Route path="/saved" element={<Layout><Favorites /></Layout>} />
                <Route path="/favorites" element={<Layout><Favorites /></Layout>} />
                <Route path="/activity-feed" element={<Layout><ActivityFeed /></Layout>} />
                <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
                <Route path="/search" element={<Layout><SearchResults /></Layout>} />
                <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
                <Route path="/subscription-success" element={<Layout><SubscriptionSuccess /></Layout>} />
                <Route path="/blog" element={<Layout><Blog /></Layout>} />
                <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
                <Route path="/about" element={<Layout><About /></Layout>} />
                <Route path="/faq" element={<Layout><FAQ /></Layout>} />
                <Route path="/checkout-success" element={<Layout><CheckoutSuccess /></Layout>} />
                <Route path="/orders" element={<Layout><Orders /></Layout>} />
                <Route path="/orders/:orderId" element={<Layout><OrderDetails /></Layout>} />
                <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
                <Route path="/safe-meetup" element={<Layout><SafeMeetup /></Layout>} />
                <Route path="/safety-center" element={<Layout><SafetyCenter /></Layout>} />
                <Route path="/nearby-alerts" element={<Layout><NearbyAlerts /></Layout>} />
                <Route path="/search-alerts" element={<Layout><SearchAlerts /></Layout>} />
                <Route path="/alert" element={<Layout><SearchAlerts /></Layout>} />
                <Route path="/map" element={<Layout><MapView /></Layout>} />
                <Route path="/delivery-network" element={<Layout><DeliveryNetwork /></Layout>} />
                <Route path="/live-tracking" element={<LiveTrackingMap />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
              <InstallPrompt />
            </BrowserRouter>
            </TooltipProvider>
          </ComparisonProvider>
        </CategoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
