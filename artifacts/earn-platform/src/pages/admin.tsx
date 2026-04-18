import { 
  useAdminGetUsers, 
  useAdminBlockUser, 
  useAdminAdjustBalance, 
  useAdminGetDeposits, 
  useAdminApproveDeposit, 
  useAdminGetWithdrawals, 
  useAdminApproveWithdrawal, 
  useAdminGetAnalytics 
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
  getAdminGetAnalyticsQueryKey
} from "@workspace/api-client-react";
import { Users, ArrowDownToLine, ArrowUpFromLine, Activity, Ban, Edit, CheckCircle, XCircle } from "lucide-react";

export default function Admin() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform management and analytics.</p>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6 border border-slate-200">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Activity className="w-4 h-4 mr-2"/> Analytics</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><Users className="w-4 h-4 mr-2"/> Users</TabsTrigger>
          <TabsTrigger value="deposits" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><ArrowDownToLine className="w-4 h-4 mr-2"/> Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals" className="data-[state=active]:bg-white data-[state=active]:shadow-sm"><ArrowUpFromLine className="w-4 h-4 mr-2"/> Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="deposits"><DepositsTab /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsTab /></TabsContent>
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

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  if (isLoading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500">User</th>
                <th className="px-6 py-3 font-medium text-slate-500">Stats</th>
                <th className="px-6 py-3 font-medium text-slate-500">Balance</th>
                <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users?.map(u => (
                <tr key={u.id} className="bg-white">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{u.username} {u.isAdmin && <Badge variant="secondary" className="ml-1 text-[10px]">Admin</Badge>}</div>
                    <div className="text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">Refs: {u.referralCount}</div>
                    <div className="text-xs">Earned: ${u.totalEarnings.toFixed(2)}</div>
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
                    >
                      {u.isBlocked ? "Unblock" : <Ban className="w-4 h-4" />}
                    </Button>
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
    <Card>
      <CardHeader>
        <CardTitle>Deposit Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500">Details</th>
                <th className="px-6 py-3 font-medium text-slate-500">Payment Info</th>
                <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deposits?.map(d => (
                <tr key={d.id} className="bg-white">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">${d.amount.toFixed(2)}</div>
                    <div className="text-slate-500 text-xs">User: {d.username}</div>
                    <div className="text-slate-400 text-xs">{format(new Date(d.createdAt), "MMM d, yyyy HH:mm")}</div>
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
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500">Details</th>
                <th className="px-6 py-3 font-medium text-slate-500">Destination Account</th>
                <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {withdrawals?.map(w => (
                <tr key={w.id} className="bg-white">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">${w.amount.toFixed(2)}</div>
                    <div className="text-slate-500 text-xs">User: {w.username}</div>
                    <div className="text-slate-400 text-xs">{format(new Date(w.createdAt), "MMM d, yyyy HH:mm")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="mb-1 capitalize">{w.method.replace('_', ' ')}</Badge>
                    <div className="text-sm font-medium">{w.accountName}</div>
                    <div className="text-xs text-slate-500 font-mono">{w.accountNumber}</div>
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
