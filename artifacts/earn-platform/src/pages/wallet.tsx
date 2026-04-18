import { useGetTransactions, TransactionType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Wallet() {
  const { data: transactions, isLoading } = useGetTransactions();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "deposit":
      case "ad_earning":
      case "referral_commission":
      case "joining_bonus":
      case "reward":
      case "global_pool":
      case "admin_adjustment":
        return "default";
      case "withdrawal":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "ad_earning": return "Ad Reward";
      case "referral_commission": return "Referral";
      case "joining_bonus": return "Joining Bonus";
      case "reward": return "Milestone Reward";
      case "global_pool": return "Global Pool";
      case "deposit": return "Deposit";
      case "withdrawal": return "Withdrawal";
      case "admin_adjustment": return "Adjustment";
      default: return type;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transaction History</h1>
        <p className="text-slate-500 mt-1">View your recent earnings, deposits, and withdrawals.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {!transactions || transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No transactions found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {tx.description}
                      </p>
                      <Badge variant={getBadgeVariant(tx.type)} className="capitalize text-[10px] px-1.5 py-0">
                        {getTransactionLabel(tx.type)}
                      </Badge>
                      {tx.status === "pending" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50">
                          Pending
                        </Badge>
                      )}
                      {tx.status === "failed" && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Failed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(new Date(tx.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className={`font-bold whitespace-nowrap ${
                    tx.amount > 0 ? 'text-green-600' : 
                    tx.amount < 0 ? 'text-slate-900' : 'text-slate-600'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
