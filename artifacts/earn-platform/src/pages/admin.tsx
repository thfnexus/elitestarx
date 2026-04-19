import { 
  useAdminGetUsers, 
  useAdminBlockUser, 
  useAdminAdjustBalance, 
  useAdminGetDeposits, 
  useAdminApproveDeposit, 
  useAdminGetWithdrawals, 
  useAdminApproveWithdrawal, 
  useAdminGetAnalytics,
  useAdminGetSettings,
  useAdminUpdateSetting
} from "@workspace/api-client-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getAdminGetUsersQueryKey, 
  getAdminGetDepositsQueryKey, 
  getAdminGetWithdrawalsQueryKey,
  getAdminGetAnalyticsQueryKey,
  getAdminGetSettingsQueryKey
} from "@workspace/api-client-react";
import { Users, ArrowDownToLine, ArrowUpFromLine, Activity, Ban, Edit, CheckCircle, XCircle, Settings, Globe, Save, Trophy, Shield, Trash2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

interface WeeklyPayout {
  id: number;
  username: string;
  referralCount: number;
  amountPaid: number;
  weekStartDate: string;
  weekEndDate: string;
  createdAt: string;
}

export default function Admin() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">Platform management and analytics.</p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 mb-6 border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"><Activity className="w-4 h-4 mr-2"/> Analytics</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"><Users className="w-4 h-4 mr-2"/> Users</TabsTrigger>
          <TabsTrigger value="deposits" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"><ArrowDownToLine className="w-4 h-4 mr-2"/> Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"><ArrowUpFromLine className="w-4 h-4 mr-2"/> Withdrawals</TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"><Trophy className="w-4 h-4 mr-2"/> Weekly Bonuses</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm"><Settings className="w-4 h-4 mr-2"/> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="deposits"><DepositsTab /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsTab /></TabsContent>
        <TabsContent value="weekly"><WeeklyPerformanceTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics, isLoading } = useAdminGetAnalytics();

  if (isLoading) return <div className="p-8 text-center">Loading analytics...</div>;
  if (!analytics) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle></CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.totalUsers}</div>
          <p className="text-xs text-green-600 mt-1">+{analytics.newUsersToday} today</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Active Today</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">{analytics.activeUsersToday}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Distributed</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold text-green-600">${analytics.totalEarningsDistributed.toFixed(2)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Deposits</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">${analytics.totalDeposits.toFixed(2)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Total Withdrawals</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-bold">${analytics.totalWithdrawals.toFixed(2)}</div></CardContent>
      </Card>
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-700">Pending Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="text-lg font-semibold text-amber-900">{analytics.pendingDeposits} Deposits</div>
          <div className="text-lg font-semibold text-amber-900">{analytics.pendingWithdrawals} Withdrawals</div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useAdminGetUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const blockMutation = useAdminBlockUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User status updated" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      }
    }
  });

  const adjustMutation = useAdminAdjustBalance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Balance adjusted" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      }
    }
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number, isAdmin: boolean }) => {
      return await customFetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin })
      });
    },
    onSuccess: () => {
      toast({ title: "User role updated successfully" });
      queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      setRoleDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Role update failed", description: err.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await customFetch(`/api/admin/users/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({ title: "User deleted permanently" });
      queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Deletion failed", description: err.message });
    }
  });

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  if (isLoading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <CardHeader>
        <CardTitle className="font-black text-slate-900 dark:text-slate-100">User Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">User</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Stats</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Weekly Joins</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Balance</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users?.map(u => (
                <tr key={u.id} className="bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-slate-900 dark:text-slate-100">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{u.username} {u.isAdmin && <Badge variant="secondary" className="ml-1 text-[10px]">Admin</Badge>}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">{u.email}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">WA: {u.whatsappNumber || "Not recorded"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">Refs: {u.referralCount}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Earned: ${u.totalEarnings.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-amber-600 dark:text-amber-500 font-bold">This Week: {u.thisWeekReferrals || 0}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">Last Week: {u.lastWeekReferrals || 0}</div>
                  </td>
                  <td className="px-6 py-4 font-bold">
                    ${u.balance.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2"><Edit className="w-4 h-4"/></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Adjust Balance: {u.username}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Amount (use negative to deduct)</Label>
                            <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="0.00" />
                          </div>
                          <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="e.g. Correction" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => adjustMutation.mutate({ id: u.id, data: { amount: Number(adjustAmount), reason: adjustReason } })}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant={u.isBlocked ? "outline" : "destructive"} 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => blockMutation.mutate({ id: u.id, data: { blocked: !u.isBlocked } })}
                      title={u.isBlocked ? "Unblock User" : "Block User"}
                    >
                      {u.isBlocked ? "Unblock" : <Ban className="w-4 h-4" />}
                    </Button>

                    <Dialog open={roleDialogOpen && activeUserId === u.id} onOpenChange={(open) => { setRoleDialogOpen(open); if(open) setActiveUserId(u.id); }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-8 px-2 ${u.isAdmin ? 'text-blue-600 border-blue-200' : 'text-slate-400'}`}
                          title={u.isAdmin ? "Remove Admin Role" : "Make Admin"}
                        >
                          <Shield className="w-4 h-4"/>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{u.isAdmin ? "Remove Admin Permissions?" : "Promote to Administrator?"}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {u.isAdmin 
                              ? `Are you sure you want to remove admin access for ${u.username}? They will lose all management privileges.`
                              : `Warning: You are about to grant administrative access to ${u.username}. They will have full control over balances, users, and platform settings.`}
                          </p>
                          {!u.isAdmin && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800 dark:text-amber-300">This action grants powerful permissions. Double check that you are promoting the correct user.</p>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            variant={u.isAdmin ? "destructive" : "default"} 
                            onClick={() => roleMutation.mutate({ id: u.id, isAdmin: !u.isAdmin })}
                            disabled={roleMutation.isPending}
                          >
                            {roleMutation.isPending ? "Updating..." : "Confirm Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={deleteDialogOpen && activeUserId === u.id} onOpenChange={(open) => { setDeleteDialogOpen(open); if(open) setActiveUserId(u.id); }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete Account Permanently"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-red-200 dark:border-red-900">
                        <DialogHeader>
                          <DialogTitle className="text-red-600 flex items-center gap-2">
                             <Trash2 className="w-5 h-5" /> Permanent Deletion
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Are you absolutely sure you want to delete <span className="underline decoration-red-500">{u.username}'s</span> account?
                          </p>
                          <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium list-disc list-inside">
                            <p className="text-red-500 font-black uppercase tracking-widest text-[10px]">What happens if you delete this user:</p>
                            <p>• Entire transaction history will be wiped.</p>
                            <p>• All referral links and commissions will be destroyed.</p>
                            <p>• Ad watch records and earned bonuses will be gone.</p>
                            <p>• This action is <strong>IRREVERSIBLE</strong>.</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="destructive" 
                            className="w-full sm:w-auto font-black"
                            onClick={() => deleteMutation.mutate(u.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? "Deleting..." : "YES, DELETE PERMANENTLY"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DepositsTab() {
  const { data: deposits, isLoading } = useAdminGetDeposits();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const approveMutation = useAdminApproveDeposit({
    mutation: {
      onSuccess: () => {
        toast({ title: "Deposit updated" });
        queryClient.invalidateQueries({ queryKey: getAdminGetDepositsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading deposits...</div>;

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <CardHeader>
        <CardTitle className="font-black text-slate-900 dark:text-slate-100">Deposit Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Details</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Payment Info</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deposits?.map(d => (
                <tr key={d.id} className="bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">${d.amount.toFixed(2)}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">User: {d.username}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">{format(new Date(d.createdAt), "MMM d, yyyy HH:mm")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="mb-1 capitalize">{d.method.replace('_', ' ')}</Badge>
                    <div className="text-xs font-mono">Ref: {d.transactionRef}</div>
                    {d.senderNumber && <div className="text-xs text-slate-500">Sender: {d.senderNumber}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'outline'} className={d.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {d.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {d.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={() => approveMutation.mutate({ id: d.id, data: { action: "approve" } })}>
                          <CheckCircle className="h-5 w-5"/>
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => approveMutation.mutate({ id: d.id, data: { action: "reject", notes: "Invalid reference" } })}>
                          <XCircle className="h-5 w-5"/>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function WithdrawalsTab() {
  const { data: withdrawals, isLoading } = useAdminGetWithdrawals();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const approveMutation = useAdminApproveWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Withdrawal updated" });
        queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetAnalyticsQueryKey() });
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading withdrawals...</div>;

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <CardHeader>
        <CardTitle className="font-black text-slate-900 dark:text-slate-100">Withdrawal Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Details</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Destination Account</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {withdrawals?.map(w => (
                <tr key={w.id} className="bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">${w.amount.toFixed(2)}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-xs">User: {w.username}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">{format(new Date(w.createdAt), "MMM d, yyyy HH:mm")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="mb-1 capitalize">{w.method.replace('_', ' ')}</Badge>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{w.accountName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{w.accountNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'outline'} className={w.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {w.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={() => approveMutation.mutate({ id: w.id, data: { action: "approve" } })}>
                          <CheckCircle className="h-5 w-5"/>
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => approveMutation.mutate({ id: w.id, data: { action: "reject", notes: "Account details invalid" } })}>
                          <XCircle className="h-5 w-5"/>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  const { data: settings, isLoading } = useAdminGetSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adLink, setAdLink] = useState("");

  const updateMutation = useAdminUpdateSetting({
    mutation: {
      onSuccess: () => {
        toast({ title: "Setting updated successfully" });
        queryClient.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Could not update setting.",
        });
      }
    }
  });

  // Set initial value when settings are loaded
  useState(() => {
    if (settings) {
      const adLinkSetting = settings.find(s => s.key === "ad_link");
      if (adLinkSetting) setAdLink(adLinkSetting.value);
    }
  });

  // Better way to sync initial value
  const currentAdLink = settings?.find(s => s.key === "ad_link")?.value || "";
  
  const handleSave = () => {
    updateMutation.mutate({ data: { key: "ad_link", value: adLink } });
  };

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <CardHeader>
        <CardTitle className="font-black text-slate-900 dark:text-slate-50">Platform Settings</CardTitle>
        <CardDescription className="dark:text-slate-400">Configure global platform parameters and links.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="ad-link" className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Globe className="w-4 h-4 text-slate-500" />
              Active Ad Link
            </Label>
            <div className="flex gap-2">
              <Input 
                id="ad-link"
                value={adLink || currentAdLink} 
                onChange={e => setAdLink(e.target.value)} 
                placeholder="https://example.com/ad-video"
                className="font-mono text-sm bg-white dark:bg-slate-950/50 dark:border-slate-800 text-slate-900 dark:text-slate-100"
              />
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending || (!adLink && !currentAdLink)}
                className="shrink-0"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              This link will be opened in a new window when users click "Start Ad Watch".
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyPerformanceTab() {
  const { data: payouts, isLoading } = useQuery<WeeklyPayout[]>({
    queryKey: ["/admin/weekly-payouts"],
    queryFn: async () => {
      return await customFetch("/api/admin/weekly-payouts");
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading weekly performance data...</div>;

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-slate-50 font-black">
          <Trophy className="h-5 w-5 text-amber-500" />
          Weekly Payout History
        </CardTitle>
        <CardDescription className="dark:text-slate-400">Record of automated Sunday referral bonuses paid to users.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-black text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">User</th>
                <th className="px-6 py-3 font-black text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-center">Referrals</th>
                <th className="px-6 py-3 font-black text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest">Week Period</th>
                <th className="px-6 py-3 font-black text-slate-600 dark:text-slate-400 text-[10px] uppercase tracking-widest text-right">Paid Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(!payouts || payouts.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">No weekly payouts have been processed yet. Payouts happen automatically every Sunday.</td>
                </tr>
              )}
               {payouts?.map(p => (
                <tr key={p.id} className="bg-white dark:bg-slate-900/20 hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 dark:text-slate-100">{p.username}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-tighter">Processed: {format(new Date(p.createdAt), "MMM d, yyyy")}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className="font-black text-amber-600 border-amber-500/30">{p.referralCount} Refs</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {format(new Date(p.weekStartDate), "MMM d")} - {format(new Date(p.weekEndDate), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                    +${Number(p.amountPaid).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
