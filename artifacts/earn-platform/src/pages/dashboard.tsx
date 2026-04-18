import { useGetDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Users, TrendingUp, Copy, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboard();
  const [copied, setCopied] = useState(false);

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
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.username}</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
          <span className="text-sm font-medium text-slate-600">Ref Code:</span>
          <code className="bg-slate-100 px-2 py-1 rounded text-sm font-bold text-primary">{user?.referralCode}</code>
          <Button variant="ghost" size="icon" className="h-8 w-8 ml-1" onClick={copyToClipboard}>
            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
          </Button>
        </div>
      </div>

      {stats.uplinerName && (
        <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm border border-blue-100 flex items-center">
          <Users className="h-4 w-4 mr-2 opacity-70" />
          Invited by <strong className="ml-1">{stats.uplinerName}</strong>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">${stats.balance.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Lifetime generated</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Withdrawn</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">${stats.totalWithdrawn.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">Lifetime cashed out</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.referralCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active team members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Daily Joining Bonus</CardTitle>
            <p className="text-sm text-muted-foreground">Invite users today to unlock bonuses.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stats.dailyJoiningProgress} joined today</span>
                <span className="text-muted-foreground">Target: 6</span>
              </div>
              <Progress value={(stats.dailyJoiningProgress / 6) * 100} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className={`p-3 rounded-lg border ${stats.dailyJoiningProgress >= 2 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <div className="font-bold text-lg mb-1">$1</div>
                <div>2 Joins</div>
              </div>
              <div className={`p-3 rounded-lg border ${stats.dailyJoiningProgress >= 4 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <div className="font-bold text-lg mb-1">+$1</div>
                <div>4 Joins</div>
              </div>
              <div className={`p-3 rounded-lg border ${stats.dailyJoiningProgress >= 6 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <div className="font-bold text-lg mb-1">+$2</div>
                <div>6 Joins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Today's Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Ad Earnings</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.todayAdEarnings.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Referral Earnings</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.todayReferralEarnings.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Global Pool Share</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.globalPoolShare.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {stats.recentTransactions && stats.recentTransactions.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{tx.description}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
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
