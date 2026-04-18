import { useGetTeam, useGetReferralEarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Team() {
  const { data: team, isLoading: teamLoading } = useGetTeam();
  const { data: earnings, isLoading: earningsLoading } = useGetReferralEarnings();

  if (teamLoading || earningsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Team</h1>
          <p className="text-slate-500 mt-1">Build your network to earn 5-level deep commissions.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          Total Members: {team?.totalMembers || 0}
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {levelCommissions.map((l) => (
          <Card key={`summary-l${l.level}`} className="shadow-sm border-slate-200">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="text-sm font-medium text-slate-500 mb-1">Level {l.level}</div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{l.members.length}</div>
              <div className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
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
            <Card key={`members-l${level.level}`} className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex justify-between">
                  <span>Level {level.level} Members</span>
                  <span className="text-sm font-normal text-muted-foreground">{level.members.length} users</span>
                </CardTitle>
                <CardDescription>Users who joined through your network at level {level.level}.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {level.members.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No members on this level yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {level.members.map((member) => (
                      <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-medium text-slate-900">{member.username}</p>
                          <p className="text-xs text-slate-500">Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}</p>
                        </div>
                        <Badge variant={member.isActive ? "default" : "secondary"} className={member.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
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
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Recent Referral Earnings</CardTitle>
              <CardDescription>Commissions credited to your account from team activity.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!earnings || earnings.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No referral earnings yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900 flex items-center gap-2">
                          From {earning.fromUsername}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50">L{earning.level}</Badge>
                        </p>
                        <p className="text-xs text-slate-500">{format(new Date(earning.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      <div className="font-bold text-green-600">
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
