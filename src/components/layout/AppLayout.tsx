import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
type AppLayoutProps = {
  children: React.ReactNode;
};
export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <>{children}</>;
  }
  return (
    <div className="flex h-screen bg-industrial-black">
      {isMobile ? (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-full max-w-xs p-0 border-r-2 bg-industrial-black border-border">
            <AppSidebar />
          </SheetContent>
        </Sheet>
      ) : (
        <AppSidebar />
      )}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isMobile ? 'ml-0' : 'ml-64'}`}>
        {isMobile && (
          <div className="absolute top-4 right-4 z-50">
            <Button variant="industrial" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        )}
        <div className="px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
            {children}
        </div>
      </main>
    </div>
  );
}