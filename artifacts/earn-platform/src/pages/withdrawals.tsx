import { useGetWithdrawals, useCreateWithdrawal, useGetDashboard } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWithdrawalsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const withdrawalSchema = z.object({
  method: z.enum(["jazzcash", "easypaisa", "bank_transfer"] as const),
  amount: z.coerce.number().min(0.5, "Minimum withdrawal is $0.5"),
  accountNumber: z.string().min(5, "Valid account number is required"),
  accountName: z.string().min(2, "Account holder name is required"),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function Withdrawals() {
  const { data: withdrawals, isLoading: withdrawalsLoading } = useGetWithdrawals();
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isFirstWithdrawal = !withdrawals || withdrawals.length === 0;

  const form = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      method: "jazzcash",
      amount: isFirstWithdrawal ? 0.5 : 1,
      accountNumber: "",
      accountName: "",
    },
  });

  const createWithdrawalMutation = useCreateWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Withdrawal requested", description: "Your request is pending processing (up to 24h)." });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      },
      onError: (error) => {
        toast({ 
          variant: "destructive", 
          title: "Failed to request", 
          description: error.data?.error || "Could not process withdrawal request." 
        });
      }
    }
  });

  const minAmount = isFirstWithdrawal ? 0.5 : 1.0;

  const onSubmit = (data: WithdrawalForm) => {
    if (data.amount < minAmount) {
      toast({ 
        variant: "destructive", 
        title: "Invalid amount", 
        description: `Minimum withdrawal for ${isFirstWithdrawal ? 'first' : 'subsequent'} time is $${minAmount.toFixed(2)}.` 
      });
      return;
    }
    createWithdrawalMutation.mutate({ data });
  };

  if (withdrawalsLoading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">Withdrawals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm font-medium">Cash out your earnings directly to your local account.</p>
        </div>
        <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full md:w-auto">
          <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-2 px-4 flex-1">
            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Total Cashout</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">${(dashboard?.totalWithdrawnAmount || 0).toFixed(2)}</p>
          </Card>
          <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-2 px-4 flex-1">
            <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">Pending</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">${(dashboard?.pendingWithdrawalsAmount || 0).toFixed(2)}</p>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-12 lg:col-span-5 space-y-6">
          <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="flex justify-between items-center text-lg font-black text-slate-900 dark:text-slate-50">
                <span>Request Payout</span>
                <span className="text-sm font-black text-slate-600 dark:text-slate-300 flex items-center bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <Wallet className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Bal: ${dashboard?.balance.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-sm font-black">Policy & Limits</AlertTitle>
                <AlertDescription className="text-xs mt-1.5 space-y-1 font-medium">
                  <p>• {isFirstWithdrawal ? <strong>First withdrawal minimum is $0.50</strong> : <strong>Minimum withdrawal is $1.00</strong>}</p>
                  <p>• All requests are processed within <strong>24 hours</strong>.</p>
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdrawal Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="jazzcash">JazzCash</SelectItem>
                            <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD) - Min ${minAmount.toFixed(2)}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number / IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name on the account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary hover:bg-primary/90 !text-white font-black text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-100 disabled:bg-primary/80" 
                    disabled={createWithdrawalMutation.isPending || (dashboard?.balance || 0) < form.watch("amount")}
                  >
                    {createWithdrawalMutation.isPending ? "Processing..." : "Submit Withdrawal"}
                  </Button>
                  {(dashboard?.balance || 0) < form.watch("amount") && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-black text-center mt-3 uppercase tracking-wider bg-red-50 dark:bg-red-500/10 py-2.5 rounded-lg border border-red-200 dark:border-red-500/30">
                       ⚠️ INSUFFICIENT BALANCE FOR THIS AMOUNT
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 h-full">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              <CardTitle className="font-black text-slate-900 dark:text-slate-50">Withdrawal History</CardTitle>
              <CardDescription className="dark:text-slate-400 font-medium">Track your payout requests.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!withdrawals || withdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No withdrawal history found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-slate-950 dark:text-slate-50">${withdrawal.amount.toFixed(2)}</span>
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md capitalize uppercase tracking-tighter">
                            {withdrawal.method.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-300 font-bold">{withdrawal.accountName} <span className="text-slate-500 dark:text-slate-500 font-normal">({withdrawal.accountNumber})</span></p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{format(new Date(withdrawal.createdAt), "MMM d, yyyy h:mm a")}</p>
                        {withdrawal.notes && withdrawal.status === 'rejected' && (
                          <p className="text-xs text-destructive mt-2 bg-destructive/10 dark:bg-destructive/20 p-2 rounded border border-destructive/20">
                            Reason: {withdrawal.notes}
                          </p>
                        )}
                      </div>
                      <div>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
