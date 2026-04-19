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
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumCard } from "@/components/PremiumCard";
import { useRef } from "react";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState((user as any)?.profileImage || "");

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1 w-full">
           <PremiumCard 
             user={user as any} 
             onAvatarClick={() => fileInputRef.current?.click()} 
           />
        </div>
        
        <div className="hidden lg:flex flex-col items-center justify-center p-6 bg-card rounded-[2rem] border border-border/50 shadow-sm min-w-[200px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Account Status</span>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 shadow-inner">
            <div className={`h-2.5 w-2.5 rounded-full ${stats?.hasActivePlan ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-sm font-black text-primary uppercase tracking-tighter">{stats?.hasActivePlan ? 'Elite Verified' : 'Standard'}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Profile Details Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <User className="h-4 w-4" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 space-y-6">
              <div className="grid gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Username</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary/60" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">{user.username}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-amber-500/60" />
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

          {/* Upload Tips Section */}
          <Card className="shadow-md border-border bg-card/40 backdrop-blur-sm">
            <CardHeader className="pb-3 px-6 pt-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> Earning Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 text-[11px] font-medium text-muted-foreground leading-relaxed">
               Click your **Premium Avatar** at the top to upload a new profile picture directly from your device. 
               <div className="mt-2 text-primary font-bold">Image size limit: 2MB</div>
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
}
