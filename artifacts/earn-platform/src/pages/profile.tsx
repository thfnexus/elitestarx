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
  Loader2,
  Sparkles
} from "lucide-react";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileImage: string | null) => {
      return await customFetch("/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({ profileImage })
      });
    },
    onSuccess: () => {
      toast({ title: "Profile picture updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Update failed", description: err.message });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Max size is 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateProfileMutation.mutate(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

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
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg border-border border-t-4 border-t-primary overflow-hidden bg-white/50 dark:bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="h-28 w-28 rounded-full bg-primary/10 text-primary flex items-center justify-center text-5xl font-bold mb-4 ring-4 ring-white dark:ring-slate-800 shadow-xl overflow-hidden transition-transform group-hover:scale-105 duration-300">
                  {(user as any).profileImage ? (
                    <img src={(user as any).profileImage} alt={user.username} className="h-full w-full object-cover" />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 pointer-events-none">
                  <Camera className="h-4 w-4" />
                </div>
              </div>

              {(user as any).profileImage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 mb-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 text-[10px] font-bold tracking-wider uppercase h-6 px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateProfileMutation.mutate(null);
                  }}
                  disabled={updateProfileMutation.isPending}
                >
                  Remove Photo
                </Button>
              )}
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{user.username}</h2>
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

          <Card className="shadow-md border-border bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 text-[11px] font-medium text-muted-foreground leading-relaxed">
               Click your **Avatar** to upload a new profile picture. Real photos build more trust with your referral team!
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md border-border group overflow-hidden bg-white/50 dark:bg-card/50 backdrop-blur-sm">
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
                    <p className="font-bold text-slate-700 dark:text-slate-300 break-all">{user.email}</p>
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

          <Card className="shadow-lg border-border overflow-hidden relative bg-white/50 dark:bg-card/50 backdrop-blur-sm">
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
}
