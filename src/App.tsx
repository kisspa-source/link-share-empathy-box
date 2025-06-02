import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { TestPanel } from '@/components/TestPanel';

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import FolderView from "./pages/FolderView";
import CollectionsList from "./pages/CollectionsList";
import CollectionView from "./pages/CollectionView";
import TagsList from "./pages/TagsList";
import TagDetail from "./pages/TagDetail";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <BookmarkProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/folder/:folderId" element={<FolderView />} />
                <Route path="/collections" element={<CollectionsList />} />
                <Route path="/collections/:collectionId" element={<CollectionView />} />
                <Route path="/tags" element={<TagsList />} />
                <Route path="/tags/:tagId" element={<TagDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/u/:userId" element={<UserProfile />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            {import.meta.env.DEV && <TestPanel />}
          </BookmarkProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
