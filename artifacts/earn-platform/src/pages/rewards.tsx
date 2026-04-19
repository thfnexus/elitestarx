import { useGetRewards, useClaimReward } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Gift, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Rewards() {
  const queryClient = useQueryClient();
  const { data: rewardsData, isLoading } = useGetRewards();
  const claimRewardMutation = useClaimReward();

  const handleClaim = async (referrals: number) => {
    try {
      await claimRewardMutation.mutateAsync({ data: { referrals } });
      toast.success("Reward claimed successfully!");
      queryClient.invalidateQueries({ queryKey: ["/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/users/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/wallet/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to claim reward");
    }
  };

  if (isLoading || !rewardsData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { totalReferrals, milestones, totalRewardsClaimed } = rewardsData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Elite StarX Rewards</h1>
          <p className="text-muted-foreground mt-1">Unlock cash bonuses gradually as you hit referral targets.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-card border border-border shadow-sm px-4 py-2 rounded-lg text-center min-w-[120px]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Total Referrals</div>
            <div className="text-xl font-black text-primary">{totalReferrals}</div>
          </div>
          <div className="bg-card border border-border shadow-sm px-4 py-2 rounded-lg text-center min-w-[120px]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Claimed Rewards</div>
            <div className="text-xl font-black text-green-500">${totalRewardsClaimed.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const isUnlocked = totalReferrals >= milestone.referrals;
          
          // Sequential progress calculation
          const prevMilestoneReferrals = index === 0 ? 0 : milestones[index - 1].referrals;
          let progress = 0;
          let currentProgressCount = 0;
          const requiredForThisStar = milestone.referrals - prevMilestoneReferrals;

          if (totalReferrals >= milestone.referrals) {
            progress = 100;
            currentProgressCount = requiredForThisStar;
          } else if (totalReferrals > prevMilestoneReferrals) {
            currentProgressCount = totalReferrals - prevMilestoneReferrals;
            progress = (currentProgressCount / requiredForThisStar) * 100;
          }

          const isCurrentActive = totalReferrals >= prevMilestoneReferrals && totalReferrals < milestone.referrals;
          const starNumber = index + 1;

          return (
            <Card 
              key={milestone.referrals} 
              className={`relative overflow-hidden border-0 shadow-md ${milestone.claimed ? 'bg-slate-50 opacity-90' : 'bg-white'} border-l-[6px] ${milestone.claimed ? 'border-l-green-500' : isCurrentActive ? 'border-l-primary ring-1 ring-primary/10' : 'border-l-slate-300'}`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-4 flex-1 w-full shrink-0">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${milestone.claimed ? 'bg-green-500' : isCurrentActive ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                  
                  <div className="flex items-center gap-0.5 shrink-0 min-w-[80px]">
                    {Array.from({ length: Math.min(starNumber, 10) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  
                  <div className="text-xl font-black text-[#5a45ff]">
                    ${milestone.amount}
                  </div>
                </div>

                <div className="flex-1 w-full px-2 sm:px-6">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      {isUnlocked ? "Completed" : isCurrentActive ? "In Progress" : "Locked"}
                    </span>
                    <span>
                      {Math.min(totalReferrals, milestone.referrals)} / {milestone.referrals}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={`h-2.5 ${milestone.claimed ? '[&>div]:bg-green-500' : isCurrentActive ? '[&>div]:bg-primary' : '[&>div]:bg-slate-300'}`} 
                  />
                  <div className="text-right text-[10px] text-muted-foreground mt-1 block sm:hidden">
                    Target: {milestone.referrals}
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  {milestone.claimed ? (
                    <Button disabled variant="outline" className="w-full sm:w-auto h-11 text-green-600 border-green-200 bg-green-50 uppercase tracking-wider font-bold text-xs ring-0">
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Claimed
                    </Button>
                  ) : isUnlocked ? (
                    <Button 
                      onClick={() => handleClaim(milestone.referrals)}
                      disabled={claimRewardMutation.isPending}
                      className="w-full sm:w-auto h-11 bg-green-500 hover:bg-green-600 text-white shadow-md uppercase tracking-wider font-bold text-xs"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      {claimRewardMutation.isPending ? "Claiming..." : "Claim Now"}
                    </Button>
                  ) : (
                    <div className="w-full sm:w-auto h-11 flex items-center justify-center sm:justify-end px-5 bg-[#5a45ff] text-white rounded-md font-medium text-sm shadow-sm whitespace-nowrap opacity-90">
                      Need {milestone.referrals} Total
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
