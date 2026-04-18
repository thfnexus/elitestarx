import { useGetAdStatus, useWatchAd } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAdStatusQueryKey } from "@workspace/api-client-react";

export default function Ads() {
  const { data: status, isLoading } = useGetAdStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const watchAdMutation = useWatchAd({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Ad Completed",
          description: `You earned $${data.earned.toFixed(3)}. Total today: $${data.totalToday.toFixed(3)}`,
        });
        setIsWatching(false);
        setTimer(30);
        queryClient.invalidateQueries({ queryKey: getGetAdStatusQueryKey() });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Error watching ad",
          description: err.data?.error || "Failed to process ad viewing.",
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Watch Ads</h1>
        <p className="text-slate-500 mt-1">Watch 30-second video ads to earn $0.018 per ad.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
            <CardDescription>Your ad watching limit resets daily at midnight.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">{status.adsWatchedToday} / {status.dailyLimit} Ads Watched</span>
                <span className="text-slate-500">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-500">Today's Earnings</p>
                <p className="text-2xl font-bold text-slate-900">${status.earningsToday.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Ad Viewer</CardTitle>
            <CardDescription>Do not close the page while the timer is running.</CardDescription>
          </CardHeader>
          <CardContent>
            {status.dailyLimitReached ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-3" />
                <p className="font-medium text-slate-900">Daily Limit Reached</p>
                <p className="text-sm text-slate-500 mt-1">Come back tomorrow to watch more ads and earn.</p>
              </div>
            ) : isWatching ? (
              <div className="bg-slate-900 rounded-lg aspect-video flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-800 opacity-50"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <Clock className="h-12 w-12 mb-4 animate-pulse" />
                  <p className="text-xl font-medium mb-2">Watching Ad...</p>
                  <p className="text-4xl font-bold font-mono tracking-wider">{timer}s</p>
                  <p className="text-sm mt-4 text-slate-400">Do not refresh or leave this page</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg aspect-video flex flex-col items-center justify-center text-center p-6">
                <PlayCircle className="h-16 w-16 text-primary mb-4 opacity-80" />
                <h3 className="font-semibold text-lg text-slate-900">Ready to Earn</h3>
                <p className="text-sm text-slate-500 mb-6 mt-1">Watch a 30-second ad for $0.018</p>
                <Button 
                  size="lg" 
                  onClick={() => setIsWatching(true)}
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
