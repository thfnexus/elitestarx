import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wallet, 
  PlaySquare, 
  Users, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Gift, 
  Activity, 
  ShieldAlert,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/wallet", label: "Transactions", icon: Wallet },
    { href: "/ads", label: "Watch Ads", icon: PlaySquare },
    { href: "/team", label: "My Team", icon: Users },
    { href: "/deposits", label: "Deposits", icon: ArrowDownToLine },
    { href: "/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
    { href: "/rewards", label: "Rewards", icon: Gift },
    { href: "/live-feed", label: "Live Feed", icon: Activity },
  ];

  if (user.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin Panel", icon: ShieldAlert });
  }

  const NavLinks = () => (
    <div className="flex flex-col gap-1 p-4">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </span>
          </Link>
        );
      })}
      <div className="mt-8 border-t pt-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
          onClick={() => {
            logout();
            setMobileOpen(false);
          }}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="font-bold text-lg text-primary tracking-tight">EarnHub</div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="p-4 border-b">
              <div className="font-bold text-lg text-primary tracking-tight">EarnHub</div>
            </div>
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background fixed inset-y-0 z-20">
        <div className="h-14 flex items-center px-6 border-b">
          <div className="font-bold text-xl text-primary tracking-tight">EarnHub</div>
        </div>
        <div className="flex-1 overflow-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t bg-muted/20">
          <div className="text-sm font-medium">{user.username}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-[100dvh]">
        {/* Desktop Header */}
        <header className="hidden md:flex h-14 items-center gap-4 border-b bg-background px-6 lg:px-8 sticky top-0 z-10">
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
              Balance: ${user.balance.toFixed(2)}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
