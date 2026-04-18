import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, TrendingUp, Users, Zap, PlayCircle } from "lucide-react";
import { useEffect } from "react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl tracking-tight text-primary">EarnHub</div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-slate-600 hover:text-slate-900">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="font-medium shadow-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10" />
          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              The modern way to multiply your time
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Turn your network into <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                measurable wealth.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              A transparent, structured earning platform. Watch ads, build your team, and claim milestone rewards with instant withdrawals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-md">
                  Start Earning Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Precision Earning Mechanics</h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg">Built like a fintech product, engineered for transparency.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Guaranteed Ad Yields</h3>
                <p className="text-slate-600 leading-relaxed">
                  Earn exactly $0.018 for every ad watched. No hidden mechanics, just a 30-second timer and direct deposits to your balance.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">5-Level Deep Commissions</h3>
                <p className="text-slate-600 leading-relaxed">
                  Structured referral tiers paying from $0.54 to $0.04 down to your 5th level. Watch your passive income grow as your network expands.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Frictionless Withdrawals</h3>
                <p className="text-slate-600 leading-relaxed">
                  Cash out directly to JazzCash, EasyPaisa, or Bank Transfer. Minimum withdrawal is just $1.00. Track your transactions in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <div className="font-bold text-xl tracking-tight text-slate-900 mb-4">EarnHub</div>
          <p>© {new Date().getFullYear()} EarnHub Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
