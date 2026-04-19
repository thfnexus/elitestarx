import { useGetDashboard, useBuyPlan, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Users, TrendingUp, Copy, CheckCircle2, Link2, ShieldAlert, Zap, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useGetDashboard();
  const buyPlanMutation = useBuyPlan();
  
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px] mb-1" />
                <Skeleton className="h-3 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const copyCode = () => {
    if (!stats.hasActivePlan) {
      toast.error("You must activate your account to use referral code");
      return;
    }
    navigator.clipboard.writeText(user?.referralCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    if (!stats.hasActivePlan) {
      toast.error("You must activate your account to use referral link");
      return;
    }
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const todayJoiners: string[] = (stats as any).todayJoiners || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-1">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap font-medium">
            Welcome back, <strong className="text-slate-900 dark:text-white font-black">{user?.username}</strong>
            {(stats as any).currentTier && (
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${(stats as any).currentTier.color.replace('text-', 'border-').replace('600', '200').replace('800', '200')} ${(stats as any).currentTier.color.replace('text-', 'bg-').replace('600', '50').replace('800', '50')} ${(stats as any).currentTier.color}`}>
                {(stats as any).currentTier.label}
              </span>
            )}
            {stats.uplinerName && (
              <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full bg-muted/30">
                Invited by <span className="font-bold">{stats.uplinerName}</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-xl border border-border shadow-xl backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ref Code:</span>
          {stats.hasActivePlan ? (
            <code className="bg-primary/10 px-2 py-1 rounded text-sm font-black text-primary border border-primary/20">{user?.referralCode}</code>
          ) : (
            <span className="text-xs text-muted-foreground italic">Locked</span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 text-muted-foreground hover:text-foreground" onClick={copyCode} title="Copy code" disabled={!stats.hasActivePlan}>
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!stats.hasActivePlan && (
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black text-amber-900 dark:text-amber-200">
                  {stats.pendingDeposits > 0 ? "Activation Under Review" : "Account Activation Required"}
                </h3>
                <p className="text-amber-700 dark:text-amber-400/80 mt-1 font-medium text-sm">
                  {stats.pendingDeposits > 0 
                    ? "Admin is reviewing your activation fee. Please wait up to 24 hours." 
                    : "Unlock Ads, Referral Link, and Team building features with a one-time activation fee of 800 PKR."}
                </p>
              </div>
              {stats.pendingDeposits > 0 ? (
                <div className="px-6 py-3 bg-amber-200/50 dark:bg-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 font-black text-sm border border-amber-300/50 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                  Pending Approval
                </div>
              ) : (
                <Button 
                  onClick={() => setLocation("/deposits")} 
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black px-8 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <Zap className="w-4 h-4 mr-2 fill-current" />Pay Activation Fee
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={`shadow-xl border-blue-500/20 bg-blue-500/5 backdrop-blur-md relative overflow-hidden transition-all duration-300 ${!stats.hasActivePlan ? 'grayscale opacity-60' : ''}`}>
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <CardContent className="pt-5 pb-5 px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Link2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 block">Your Referral Link</span>
                <code className="text-xs text-slate-700 dark:text-slate-200 bg-slate-100/50 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg truncate font-mono block border border-slate-200 dark:border-slate-800">
                  {stats.hasActivePlan ? referralLink : "********************************"}
                </code>
              </div>
            </div>
            <Button
              variant="default"
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-600/20 shrink-0 h-11"
              onClick={copyLink}
              disabled={!stats.hasActivePlan}
            >
              {copiedLink ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Copied!</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" />Copy Link</>
              )}
            </Button>
          </div>
          {!stats.hasActivePlan && <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-3 font-bold uppercase tracking-tight flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Please purchase a plan to unlock your referral link.
          </p>}
          {stats.hasActivePlan && <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-2">
            <Zap className="h-3 w-3 text-amber-500" /> Share this link to build your team and earn from 5 levels of referrals.
          </p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${stats.balance.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for withdraw</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-wider">Pending Withdrawals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${(stats.pendingWithdrawalsAmount || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Under review (24h)</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-wider">Total Withdrawn</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">${(stats.totalWithdrawnAmount || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime cashed out</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.referralCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Card */}
      <Card className="shadow-xl border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-y-7 gap-x-2">
            {[
              { href: "/withdrawals", label: "Withdraw",  bg: "bg-red-500",    icon: "💸" },
              { href: "/deposits",    label: "Deposit",   bg: "bg-indigo-500", icon: "💳" },
              { href: "/wallet",      label: "Wallet",    bg: "bg-green-500",  icon: "👛" },
              { href: "/rewards",     label: "Rewards",   bg: "bg-amber-500",  icon: "🎁" },
              { href: "/ads",         label: "Watch Ads", bg: "bg-rose-500",   icon: "▶️" },
              { href: "/bonus",       label: "Bonus",     bg: "bg-orange-500", icon: "🏆" },
              { href: "/team",        label: "My Team",   bg: "bg-blue-500",   icon: "👥" },
              { href: "/profile",     label: "Profile",   bg: "bg-purple-500", icon: "👤" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-3 cursor-pointer group">
                  <div className={`${item.bg} h-15 w-15 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-all duration-300 ring-2 ring-white/10 group-hover:ring-white/40 shadow-xl group-hover:shadow-${item.bg.split('-')[1]}-500/20`}>
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-black text-foreground/80 text-center uppercase tracking-tighter transition-colors duration-200 group-hover:text-amber-500 dark:group-hover:text-amber-400">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-border border-t-4 border-t-amber-400 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 font-black text-foreground">
              <Trophy className="h-5 w-5 text-amber-500" />
              Weekly Referrals (Performance)
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Track your invites for the current week.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-wider">This Week's Joins</p>
                <p className="text-4xl font-black text-amber-500">{stats.thisWeekReferrals || 0}</p>
              </div>
            </div>
            
            <div className="bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2 font-medium">
              <span>⏰</span>
              <span>Count resets automatically every <strong>Sunday at 12 AM</strong>. Admin will reward based on performance!</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-black text-foreground">Today's Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-wider text-[10px]">Ad Earnings</p>
                  <p className="text-2xl font-black text-foreground">${stats.todayAdEarnings.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center border border-blue-500/20">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pb-4">
                <div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-wider text-[10px]">Referral Earnings</p>
                  <p className="text-2xl font-black text-foreground">${stats.todayReferralEarnings.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center border border-indigo-500/20">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {stats.recentTransactions && stats.recentTransactions.length > 0 && (
        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-black text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-foreground'}`}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
