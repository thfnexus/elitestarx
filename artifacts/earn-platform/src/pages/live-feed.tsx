import { useGetLiveWithdrawals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity, BadgeDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LiveFeed() {
  const { data: withdrawals, isLoading } = useGetLiveWithdrawals({
    query: { refetchInterval: 5000 } // Poll every 5s for the "live" effect
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Live Feed
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </h1>
          <p className="text-slate-500 mt-1">Real-time approved payouts to platform members.</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-2">
          <Activity className="h-5 w-5 text-slate-500" />
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && !withdrawals ? (
            <div className="p-8 flex justify-center">
              <div className="animate-pulse flex space-x-4 w-full max-w-md">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : !withdrawals || withdrawals.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No recent withdrawals to display.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {withdrawals.map((w) => (
                <div key={w.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-slate-50/50 transition-colors animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      User <span className="font-bold text-primary">{w.username.slice(0, 3)}***</span> withdrew <span className="font-bold text-green-600">${w.amount.toFixed(2)}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase text-slate-500 border-slate-200">
                        {w.method.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(w.approvedAt), { addSuffix: true })}
                      </span>
                    </div>
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
