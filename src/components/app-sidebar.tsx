import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, HardHat, Banknote, Users, Truck, ShieldCheck, Store, Power, Settings, MessageCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Weighbridge POS", icon: HardHat },
  { href: "/finance", label: "Finance", icon: Banknote },
  { href: "/hr", label: "HR & Staff", icon: Users },
  { href: "/logistics", label: "Logistics", icon: Truck },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/chat", label: "Comms Hub", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function AppSidebar(): JSX.Element | null {
  const location = useLocation();
  const { isAuthenticated, canAccess, logout } = useAuth();
  if (!isAuthenticated) {
    return null;
  }
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-industrial-black border-r-2 border-border flex flex-col">
      <div className="flex items-center justify-center h-20 border-b-2 border-border">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold font-display text-neon-green">
          <Power className="w-8 h-8" />
          <span>SUITEWASTE</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          canAccess(item.href) && (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center p-2 text-base font-medium rounded-none uppercase tracking-wider transition-colors",
                location.pathname === item.href
                  ? "bg-neon-green text-industrial-black"
                  : "text-off-white hover:bg-gray-800"
              )}
            >
              <item.icon className="w-6 h-6 mr-3" />
              {item.label}
            </Link>
          )
        ))}
      </nav>
      <div className="p-4 mt-auto border-t-2 border-border space-y-2">
        <Button variant="destructive" className="w-full" onClick={logout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          SuiteWaste OS 2.1
          <br />
          <span className="italic">AI features have limited requests across all apps.</span>
        </p>
      </div>
    </aside>
  );
}