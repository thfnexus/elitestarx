import { useGetDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Users, CalendarCheck, Star, Zap, Gift, UserCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const WEEKLY_BONUS_PER_REFERRAL = 0.18; // $0.18 (~31 PKR) per referral per week

export default function Bonus() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboard();

  if (!user) return null;

  const currentJoiningCount = stats?.dailyJoiningProgress ?? 0;
  const pendingWeeklyBonus = currentJoiningCount * WEEKLY_BONUS_PER_REFERRAL;

  // Next Sunday calculation
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  const nextSundayStr = nextSunday.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const dailyTiers = [
    { referrals: 2, bonus: "$1.00", label: "Bronze", description: "2 Daily Joinings" },
    { referrals: 4, bonus: "$1.00", label: "Silver", description: "4 Daily Joinings" },
    { referrals: 6, bonus: "$2.00", label: "Gold",   description: "6 Daily Joinings" },
  ];

  const weeklyTiers = [
    { referrals: 1,  bonus: "$0.18",  label: "Starter",   color: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300" },
    { referrals: 5,  bonus: "$0.90",  label: "Bronze",    color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300" },
    { referrals: 10, bonus: "$1.80",  label: "Silver",    color: "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200" },
    { referrals: 20, bonus: "$3.60",  label: "Gold",      color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300" },
    { referrals: 50, bonus: "$9.00", label: "Platinum",  color: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">Bonus & Rewards</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Boost your earnings with our daily milestones and weekly referral pool.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">Total Joinings (This Week/Today)</p>
              <p className="text-4xl font-black text-slate-900 dark:text-slate-50 mt-1">{isLoading ? "..." : currentJoiningCount}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-amber-500/5">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-500 uppercase tracking-widest font-black">Weekly Pool Payout</p>
              <p className="text-lg font-black text-foreground mt-1">Every Sunday</p>
              <p className="text-[11px] text-amber-500/80 font-bold italic">Next: {nextSundayStr}</p>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DAILY BONUS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">1. Daily Joining Bonus</h2>
        </div>
        <Card className="shadow-md border-border bg-card overflow-hidden">
          <CardHeader className="bg-muted/30 dark:bg-slate-900/40 border-b border-border dark:border-slate-800">
            <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-50">Daily Milestones</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">Achieve these targets daily to get instant bonuses.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{currentJoiningCount} joined today</span>
                <span className="text-slate-500 dark:text-slate-400">Target: 6</span>
              </div>
              <Progress value={(currentJoiningCount / 6) * 100} className="h-3 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyTiers.map((tier) => {
                const isAchieved = currentJoiningCount >= tier.referrals;
                return (
                  <div 
                    key={tier.referrals} 
                    className={`relative p-5 rounded-2xl border-2 transition-all ${
                      isAchieved 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-sm' 
                        : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 shadow-none'
                    }`}
                  >
                    {isAchieved && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1.5 shadow-md">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center space-y-1">
                      <span className={`text-2xl font-black ${isAchieved ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-600'}`}>{tier.bonus}</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{tier.label} Milestone</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{tier.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
              <Star className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Note:</strong> Daily items reset at 12:00 AM. Make sure to claim your rewards as soon as you hit the target!
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* WEEKLY POOL SECTION */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-1">
          <Trophy className="h-6 w-6 text-amber-500 fill-amber-500" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">2. Weekly Referral Pool</h2>
        </div>
        <Card className="shadow-md border-slate-200 overflow-hidden">
          <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
            <CardTitle className="text-lg font-black text-amber-900 dark:text-amber-200">Weekly Unlimited Pool</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-400/80">Earn <strong>$0.18</strong> for every single referral this week.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90 uppercase tracking-widest">Pending Weekly Bonus</p>
                  <p className="text-5xl font-black mt-1">${pendingWeeklyBonus.toFixed(2)}</p>
                  <p className="text-xs mt-2 opacity-80">Calculation: {currentJoiningCount} referrals × $0.18</p>
                </div>
                <Users className="h-16 w-16 opacity-20" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider px-1">Weekly Earning Status</h3>
              {weeklyTiers.map((tier) => {
                const isAchieved = currentJoiningCount >= tier.referrals;
                return (
                  <div
                    key={tier.referrals}
                    className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 transition-all ${isAchieved ? 'bg-green-50 border-green-500' : tier.color}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black ${isAchieved ? 'bg-green-500 text-white' : 'bg-white border-2 border-current'}`}>
                        {isAchieved ? "✓" : tier.referrals}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-slate-100">{tier.label} Level</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{tier.referrals} referral{tier.referrals > 1 ? 's' : ''} target</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-lg ${isAchieved ? 'text-green-700' : 'text-slate-400'}`}>{tier.bonus}</p>
                      <Badge className={`text-[10px] uppercase font-bold px-2 ${isAchieved ? 'bg-green-200 text-green-800 border-none' : 'bg-white text-slate-400 border-slate-200'} border`}>
                        {isAchieved ? "Reached" : "Target"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-100/40 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Auto Payout Every Sunday</p>
                <p className="text-xs text-amber-700">The total amount in your weekly pool will be added to your available balance every Sunday night at 11:59 PM.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
