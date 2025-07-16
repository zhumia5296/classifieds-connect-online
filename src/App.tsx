import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <InstallPrompt />
            </BrowserRouter>
          </TooltipProvider>
        </ComparisonProvider>
      </CategoryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
