import { useAuth } from "@/lib/auth";
import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ShieldAlert, 
  CalendarDays, 
  Wallet,
  Trophy
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboard();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage your account details and view your platform status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Stats / Avatar Sidebar */}
        <Card className="md:col-span-1 shadow-sm border-border border-t-4 border-t-primary overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold mb-4 ring-4 ring-white shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user.username}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{user.email}</p>

            <div className="w-full bg-muted/30 rounded-lg p-4 border border-border flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Total Earnings</span>
                <span className="font-black text-primary">${user.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-border pt-2">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Team Members</span>
                <span className="font-black text-foreground">{user.referralCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Username</p>
                  <p className="font-bold text-foreground">{user.username}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">WhatsApp Number</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">{user.whatsappNumber || "Not provided"}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Joined Date</p>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <p className="font-medium text-foreground">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm border-border overflow-hidden`}>
            <div className={`h-1.5 w-full ${stats?.hasActivePlan ? 'bg-green-500' : 'bg-amber-500'}`}></div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" /> Subscription Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse h-16 bg-slate-100 rounded-lg"></div>
              ) : stats?.hasActivePlan ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300">Premium Plan (Active)</h3>
                    <p className="text-sm text-green-700 dark:text-green-400/80 mt-1">
                      Your ads, team building, and rewards are fully unlocked. You are enjoying all platform privileges.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-300">Free Account (Inactive)</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                      Your features are currently restricted. Please navigate to the dashboard to deposit funds and activate your plan.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
