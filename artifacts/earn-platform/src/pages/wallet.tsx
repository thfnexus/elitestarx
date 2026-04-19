import { useGetTransactions } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  ArrowUpRight, 
  CircleDollarSign,
  History,
  PlayCircle,
  Gift,
  ArrowDownCircle
} from "lucide-react";

type FilterType = 'ads' | 'withdraw' | 'bonus';

export default function Wallet() {
  const { user } = useAuth();
  const { data: transactions, isLoading } = useGetTransactions();
  const [activeFilter, setActiveFilter] = useState<FilterType>('ads');

  if (isLoading || !user) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const filteredTransactions = transactions?.filter(tx => {
    switch (activeFilter) {
      case 'ads': return tx.type === 'ad_earning';
      case 'withdraw': return tx.type === 'withdrawal';
      case 'bonus': return ['joining_bonus', 'referral_commission', 'reward', 'global_pool'].includes(tx.type);
      default: return true;
    }
  }) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <div className="bg-[#8b5cf6] text-white p-6 rounded-xl shadow-md border-b-4 border-[#7c3aed] flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-2 right-2 opacity-20 group-hover:scale-110 transition-transform">
             <WalletIcon className="h-10 w-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">Current Balance</p>
          <p className="text-2xl md:text-3xl font-black mt-2 tabular-nums tracking-tight">$ {user.balance.toFixed(4)}</p>
        </div>

        {/* Total Balance (Earnings) */}
        <div className="bg-[#10b981] text-white p-6 rounded-xl shadow-md border-b-4 border-[#059669] flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-2 right-2 opacity-20 group-hover:scale-110 transition-transform">
             <TrendingUp className="h-10 w-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">Total Balance</p>
          <p className="text-2xl md:text-3xl font-black mt-2 tabular-nums tracking-tight">$ {user.totalEarnings.toFixed(4)}</p>
        </div>

        {/* Total Withdraw */}
        <div className="bg-[#f97316] text-white p-6 rounded-xl shadow-md border-b-4 border-[#ea580c] flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-2 right-2 opacity-20 group-hover:scale-110 transition-transform">
             <ArrowUpRight className="h-10 w-10" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">Total Withdraw</p>
          <p className="text-2xl md:text-3xl font-black mt-2 tabular-nums tracking-tight">$ {user.totalWithdrawn.toFixed(4)}</p>
        </div>
      </div>

      {/* History Header Bar */}
      <div className="bg-primary dark:bg-[#6d28d9] text-primary-foreground dark:text-white py-3 px-6 rounded-lg text-center font-bold text-lg shadow-sm">
        History
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button 
          onClick={() => setActiveFilter('ads')}
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${
            activeFilter === 'ads' 
              ? 'bg-[#fbbf24] text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] scale-105' 
              : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
          }`}
        >
          Ads Earning
        </button>
        <button 
          onClick={() => setActiveFilter('withdraw')}
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${
            activeFilter === 'withdraw' 
              ? 'bg-[#fbbf24] text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] scale-105' 
              : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
          }`}
        >
          Withdraw
        </button>
        <button 
          onClick={() => setActiveFilter('bonus')}
          className={`px-6 py-2 rounded-full font-bold text-sm transition-all border-2 ${
            activeFilter === 'bonus' 
              ? 'bg-[#fbbf24] text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] scale-105' 
              : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
          }`}
        >
          Bonus
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="bg-card p-12 rounded-xl text-center border shadow-sm">
            <CircleDollarSign className="h-12 w-12 text-muted mx-auto mb-3" />
            <p className="text-muted-foreground font-medium whitespace-pre">No {activeFilter} transactions found.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isDebit = tx.amount < 0 || tx.type === 'withdrawal';
            const displayAmount = Math.abs(tx.amount).toFixed(4);
            
            // Map legacy descriptions to requested ones for display consistency
            let displayTitle = tx.description;
            if (tx.type === 'ad_earning') displayTitle = "Daily Ads Watching Earning";
            if (tx.type === 'withdrawal') displayTitle = "Withdraw";
            if (['joining_bonus', 'referral_commission', 'reward', 'global_pool'].includes(tx.type)) displayTitle = "Bonus";

            return (
              <div 
                key={tx.id} 
                className="bg-card p-4 md:p-5 rounded-xl border-b-2 border-border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {displayTitle}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {format(new Date(tx.createdAt), "dd/MM/yyyy")}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`font-black text-sm md:text-lg tabular-nums ${
                    isDebit ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {isDebit ? '-' : '+'} ${displayAmount}
                  </p>
                  {tx.status === "pending" && (
                    <span className="text-[9px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded leading-none">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
