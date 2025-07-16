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
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post-ad" element={<PostAd />} />
                <Route path="/ad/:id" element={<AdDetail />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/realtime-demo" element={<RealtimeDemo />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/mobile" element={<MobileOptimization />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/watchlists" element={<Watchlists />} />
                <Route path="/bulk-management" element={<BulkAdManagement />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />
        <Route path="/saved" element={<Favorites />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/activity-feed" element={<ActivityFeed />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/subscription-success" element={<SubscriptionSuccess />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
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
