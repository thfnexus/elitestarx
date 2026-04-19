import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { EliteStarXLogo } from "@/components/logo";
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
  Menu,
  Info,
  MessageCircle,
  Trophy,
  ChevronLeft,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useTheme } from "./theme-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/earnings-guide", label: "Earnings Guide", icon: Info },
    { href: "/join-whatsapp", label: "Join WhatsApp", icon: MessageCircle },
  ];

  if (user.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin Panel", icon: ShieldAlert });
  }

  const NavLinks = () => (
    <div className="flex flex-col gap-1 p-4 md:pt-12">
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
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Global Header */}
      <header className="sticky top-0 z-30 flex h-20 items-center border-b bg-card shadow-lg transition-colors duration-300">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-4 md:px-0">
          <EliteStarXLogo size="md" />
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block text-sm font-black bg-primary/10 text-primary dark:bg-white/10 dark:text-white px-4 py-1.5 rounded-full border border-primary/20 dark:border-white/10 shadow-inner">
              Balance: ${user.balance.toFixed(3)}
            </div>
            <Link href="/profile">
              <div 
                className="h-10 w-10 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-base cursor-pointer shadow-md hover:ring-2 hover:ring-amber-400/50 transition-all border-2 border-white/20"
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            </Link>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-foreground hover:bg-muted">
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-card border-r">
                <div className="h-20 flex items-center px-6 border-b bg-muted/30">
                  <EliteStarXLogo size="md" />
                </div>
                <div className="flex flex-col h-[calc(100vh-80px)]">
                  <div className="flex-1 overflow-auto py-6">
                    <NavLinks />
                  </div>
                  <div className="p-4 border-t bg-muted/20">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-4" 
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                    <div className="pt-4 border-t border-border">
                      <div className="text-sm font-bold text-foreground">{user.username}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      {user.whatsappNumber && (
                        <div className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-tighter shadow-sm">WA: {user.whatsappNumber}</div>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-80px)]">
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {location !== "/dashboard" && (
            <div className="max-w-5xl mx-auto mb-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all p-0 hover:bg-transparent">
                  <div className="h-8 w-8 rounded-full bg-card shadow-sm flex items-center justify-center border border-border">
                    <ChevronLeft className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="font-bold text-foreground">Back</span>
                </Button>
              </Link>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
