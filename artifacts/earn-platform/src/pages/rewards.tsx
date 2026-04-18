import { useGetRewards } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Gift, Lock } from "lucide-react";

export default function Rewards() {
  const { data: rewardsData, isLoading } = useGetRewards();

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Milestone Rewards</h1>
          <p className="text-slate-500 mt-1">Unlock cash bonuses as you hit referral targets.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border shadow-sm px-4 py-2 rounded-lg text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Referrals</div>
            <div className="text-xl font-bold text-primary">{totalReferrals}</div>
          </div>
          <div className="bg-white border shadow-sm px-4 py-2 rounded-lg text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Claimed Rewards</div>
            <div className="text-xl font-bold text-green-600">${totalRewardsClaimed.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((milestone) => {
          const isUnlocked = totalReferrals >= milestone.referrals;
          const progress = Math.min((totalReferrals / milestone.referrals) * 100, 100);
          
          return (
            <Card key={milestone.referrals} className={`shadow-sm border-slate-200 relative overflow-hidden ${milestone.claimed ? 'bg-slate-50 border-slate-200 opacity-80' : isUnlocked ? 'border-primary ring-1 ring-primary/20 shadow-md' : ''}`}>
              {milestone.claimed && (
                <div className="absolute top-3 right-3 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
              {!isUnlocked && (
                <div className="absolute top-3 right-3 text-slate-300">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold text-slate-500">Milestone</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {milestone.referrals} <span className="text-sm font-normal text-slate-500">invites</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-bold text-slate-900">${milestone.amount}</span>
                  <span className="text-sm text-slate-500 mb-1">reward</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>{totalReferrals} / {milestone.referrals}</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className={`h-2 ${milestone.claimed ? '[&>div]:bg-green-500' : isUnlocked ? '[&>div]:bg-primary' : '[&>div]:bg-slate-300'}`} 
                  />
                </div>
                
                {isUnlocked && !milestone.claimed && (
                  <div className="mt-4 bg-primary/10 text-primary text-xs font-semibold py-1.5 px-3 rounded-full inline-flex items-center">
                    <Gift className="w-3 h-3 mr-1.5" />
                    Available to Claim
                  </div>
                )}
                {milestone.claimed && (
                  <div className="mt-4 text-green-600 text-xs font-semibold inline-flex items-center">
                    Claimed Successfully
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
