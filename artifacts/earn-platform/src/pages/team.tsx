import { useGetTeam, useGetReferralEarnings, useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Users, DollarSign, ShieldAlert, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

export default function Team() {
  const { user } = useAuth();
  const { data: team, isLoading: teamLoading } = useGetTeam();
  const { data: earnings, isLoading: earningsLoading } = useGetReferralEarnings();
  const { data: dashStats } = useGetDashboard();

  if (teamLoading || earningsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check hasActivePlan from fresh dashboard stats (not stale auth context)
  const hasActivePlan = dashStats?.hasActivePlan ?? user?.hasActivePlan;

  if (!hasActivePlan) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 shadow-lg p-12 flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center mb-6">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-amber-900 dark:text-amber-100 mb-4">Plan Activation Required</h2>
          <p className="text-amber-800 dark:text-amber-400 text-lg max-w-md mb-8 font-medium">
            Aap ko apni team aur 5-level commissions dekhne ke liye **Elite Starter Plan** active karna ho ga.
          </p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button 
              asChild
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-14 rounded-xl text-lg shadow-md transition-all hover:scale-[1.02]"
            >
              <Link href="/deposits">
                <Zap className="w-5 h-5 mr-2 fill-current" /> Go to Deposits to Buy Plan
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-amber-700">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const levelCommissions = [
    { level: 1, amount: 0.54, members: team?.level1 || [] },
    { level: 2, amount: 0.29, members: team?.level2 || [] },
    { level: 3, amount: 0.14, members: team?.level3 || [] },
    { level: 4, amount: 0.07, members: team?.level4 || [] },
    { level: 5, amount: 0.04, members: team?.level5 || [] },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">My Team</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Build your network to earn 5-level deep commissions.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          Total Members: {team?.totalMembers || 0}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {levelCommissions.map((l) => (
          <Card key={`summary-l${l.level}`} className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="text-sm font-black text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-widest text-[10px]">Level {l.level}</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">{l.members.length}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40 font-bold">
                ${l.amount}/user
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
          <TabsTrigger value="members" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">
            <Users className="h-4 w-4 mr-2" /> Team Members
          </TabsTrigger>
          <TabsTrigger value="earnings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">
            <DollarSign className="h-4 w-4 mr-2" /> Commission History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {levelCommissions.map((level) => (
            <Card key={`members-l${level.level}`} className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <CardHeader className="pb-3 border-b dark:border-slate-800">
                <CardTitle className="text-lg flex justify-between font-black text-slate-900 dark:text-slate-100">
                  <span>Level {level.level} Members</span>
                  <span className="text-sm font-black text-slate-500 dark:text-slate-400">{level.members.length} users</span>
                </CardTitle>
                <CardDescription className="dark:text-slate-400 font-medium text-xs">Users who joined through your network at level {level.level}.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {level.members.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No members on this level yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {level.members.map((member) => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-200">{member.username}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}</p>
                        </div>
                        <Badge variant={member.isActive ? "default" : "secondary"} className={member.isActive ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-100 border border-green-200 dark:border-green-900" : ""}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="earnings">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="pb-3 border-b dark:border-slate-800">
              <CardTitle className="text-lg font-black text-slate-900 dark:text-slate-100">Recent Referral Earnings</CardTitle>
              <CardDescription className="dark:text-slate-400 font-medium text-xs">Commissions credited to your account from team activity.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!earnings || earnings.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No referral earnings yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-200 flex items-center gap-2">
                          From {earning.fromUsername}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 font-black">L{earning.level}</Badge>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(earning.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      <div className="font-black text-emerald-600 dark:text-emerald-400">
                        +${earning.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
