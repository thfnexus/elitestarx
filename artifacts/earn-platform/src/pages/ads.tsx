import { useGetAdStatus, useWatchAd } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, AlertCircle, Gift, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAdStatusQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Ads() {
  const { data: status, isLoading } = useGetAdStatus();
  // Dynamic rate from backend (updated per joining and daily watch)
  const dynamicPkr = (status as any)?.currentTier?.pkr ?? 5;
  const dynamicRate = (status as any)?.currentTier?.rate ?? 0.018;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const watchAdMutation = useWatchAd({
    mutation: {
      onSuccess: (res: any) => {
        toast({
          title: "Ad Completed",
          description: `You earned $${res.earned.toFixed(3)}. Total today: $${res.totalToday.toFixed(3)}`,
        });
        setIsWatching(false);
        setTimer(30);
        queryClient.invalidateQueries({ queryKey: getGetAdStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/users/dashboard"] });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Error watching ad",
          description: err.response?.data?.error || "Failed to process ad viewing.",
        });
        setIsWatching(false);
        setTimer(30);
      }
    }
  });

  const [isWatching, setIsWatching] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWatching && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && timer === 0) {
      // Ad finished
      watchAdMutation.mutate({ data: { adId: `ad_${Date.now()}`, watchDuration: 30 } });
    }
    return () => clearInterval(interval);
  }, [isWatching, timer]);

  const handleStartWatch = () => {
    if (status?.adLink) {
      window.open(status.adLink, "_blank");
      setIsWatching(true);
    } else {
      toast({
        variant: "destructive",
        title: "No ad link found",
        description: "Please contact support.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!status) return null;

  const progress = (status.adsWatchedToday / status.dailyLimit) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Watch Ads</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Watch 30-second ads daily to boost your earnings. Increase ads watch earning with increase working progress</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-500" />
              Daily Progress
            </CardTitle>
            <CardDescription className="text-muted-foreground">Your ad watching limit resets daily at midnight.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-foreground">{status.adsWatchedToday} / {status.dailyLimit} Ads Watched</span>
                <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-wider">Earned Today</p>
                  <p className="text-xl font-black text-emerald-500">${status.earningsToday.toFixed(3)}</p>
                </div>
              </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Watch Area
            </CardTitle>
            <CardDescription className="text-muted-foreground">Click the button below to start watching.</CardDescription>
          </CardHeader>
          <CardContent>
            {!status.isPlanActive ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
                <p className="font-bold text-amber-900">Elite Starter Plan Required</p>
                <p className="text-sm text-amber-700 mt-2 mb-6">You need to purchase an active plan to start watching ads and earning.</p>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Link href="/deposits">Go to Deposits to Buy Plan</Link>
                </Button>
              </div>
            ) : status.dailyLimitReached ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-3" />
                <p className="font-medium text-slate-900">Daily Limit Reached</p>
                <p className="text-sm text-slate-500 mt-1">Come back tomorrow to watch your next ad.</p>
              </div>
            ) : isWatching ? (
              <div className="bg-muted/30 border border-border rounded-lg aspect-video flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-1000" style={{ width: `${(30 - timer) / 30 * 100}%` }}></div>
                <div className="space-y-4">
                  <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse mx-auto">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-black text-foreground tabular-nums">{timer}s</div>
                  <p className="text-sm mt-4 text-muted-foreground font-medium">Please wait for the timer to finish</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/20 border border-border rounded-lg aspect-video flex flex-col items-center justify-center text-center p-6 hover:bg-muted/30 transition-colors">
                <PlayCircle className="h-16 w-16 text-primary mb-4 opacity-80" />
                <h3 className="font-black text-lg text-foreground">Ready to Earn</h3>
                <p className="text-sm text-muted-foreground mb-6 mt-1">
                  Open ad and earn <span className="text-emerald-500 font-bold">${dynamicRate.toFixed(4)}</span>
                </p>
                <Button 
                  size="lg" 
                  className="font-black px-8 rounded-xl shadow-lg ring-offset-background transition-all active:scale-95"
                  onClick={handleStartWatch}
                  disabled={watchAdMutation.isPending}
                >
                  Start Ad Watch
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
