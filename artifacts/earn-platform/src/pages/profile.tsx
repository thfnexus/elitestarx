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
  Trophy,
  Camera,
  Save,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState((user as any).profileImage || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (profileImage: string) => {
      return await customFetch("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({ profileImage })
      });
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    }
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Manage your account details and view your platform status.</p>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Status</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <div className={`h-2 w-2 rounded-full ${stats?.hasActivePlan ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-xs font-bold text-primary">{stats?.hasActivePlan ? 'Verified Elite' : 'Standard User'}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Stats / Avatar Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg border-border border-t-4 border-t-primary overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="h-28 w-28 rounded-full bg-primary/10 text-primary flex items-center justify-center text-5xl font-bold mb-4 ring-4 ring-white dark:ring-slate-800 shadow-xl overflow-hidden transition-transform group-hover:scale-105 duration-300">
                  {(user as any).profileImage ? (
                    <img src={(user as any).profileImage} alt={user.username} className="h-full w-full object-cover" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute bottom-4 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{user.username}</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{user.email}</p>

              <div className="w-full space-y-3 bg-muted/20 rounded-xl p-5 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Total Earnings</span>
                  <span className="font-black text-primary text-lg">${user.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/50 pt-3">
                  <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest text-left">Team Members</span>
                  <span className="font-black text-foreground text-lg">{user.referralCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Edit Section */}
          <Card className="shadow-md border-border bg-card">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" /> Profile Image
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-xs font-bold text-slate-500">Image URL</Label>
                <Input 
                  id="imageUrl"
                  placeholder="https://example.com/photo.jpg" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-muted/50 border-input h-10 font-medium"
                />
              </div>
              <Button 
                className="w-full h-10 font-bold gap-2 shadow-sm"
                onClick={() => updateProfileMutation.mutate(imageUrl)}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Picture
              </Button>
              <p className="text-[10px] text-center text-muted-foreground font-medium italic">
                Pro tip: Use a direct link to your photo.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          
          <Card className="shadow-md border-border group overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <User className="h-12 w-12" />
            </div>
            <CardHeader className="pb-4 border-b border-border/50 px-6 pt-6">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">Login Username</p>
                  <p className="font-black text-xl text-slate-900 dark:text-slate-100">{user.username}</p>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Verified Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary/60" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">WhatsApp Link</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500/60" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">{user.whatsappNumber || "Not registered"}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Member Since</p>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-500/60" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {format(new Date(user.createdAt), "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border overflow-hidden relative">
            <div className={`h-2 w-full absolute top-0 ${stats?.hasActivePlan ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}`}></div>
            <CardHeader className="pb-4 pt-8 px-6">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" /> Elite Status
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {isLoading ? (
                <div className="animate-pulse h-24 bg-muted rounded-2xl"></div>
              ) : stats?.hasActivePlan ? (
                <div className="bg-green-500/10 dark:bg-green-500/5 border border-green-500/20 rounded-2xl p-6 flex items-start gap-4 shadow-inner">
                  <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shrink-0">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-green-700 dark:text-green-400">Elite Account Verified</h3>
                    <p className="text-sm text-green-700/80 dark:text-green-400/70 mt-1 font-medium leading-relaxed">
                      You are a premium member of Elite StarX. All earning tiers, global pool shares, and referral rewards are fully active for your account.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shrink-0">
                    <ShieldAlert className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-700 dark:text-amber-400">Standard Account (Restricted)</h3>
                    <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mt-1 font-medium leading-relaxed">
                      Your premium features are currently locked. Upgrade to the Elite Plan to unlock full potential and start earning global pool rewards.
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
  );
}
