
import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        {isAuthenticated && showSidebar && <Sidebar />}
        
        <main className={cn(
          "flex-1",
          isAuthenticated && showSidebar ? "md:pl-64" : ""
        )}>
          <div className="container mx-auto p-4 pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
