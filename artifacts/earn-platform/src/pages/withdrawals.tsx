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
  amount: z.coerce.number().min(1, "Minimum withdrawal is $1"),
  accountNumber: z.string().min(5, "Valid account number is required"),
  accountName: z.string().min(2, "Account holder name is required"),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function Withdrawals() {
  const { data: withdrawals, isLoading: withdrawalsLoading } = useGetWithdrawals();
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isFirstWithdrawal = withdrawals?.length === 0;

  const form = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      method: "jazzcash",
      amount: 1,
      accountNumber: "",
      accountName: "",
    },
  });

  const createWithdrawalMutation = useCreateWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Withdrawal requested", description: "Your request is pending processing." });
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

  const onSubmit = (data: WithdrawalForm) => {
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Withdrawals</h1>
        <p className="text-slate-500 mt-1">Cash out your earnings directly to your local account.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="flex justify-between items-center">
                <span>Request Payout</span>
                <span className="text-sm font-normal text-muted-foreground flex items-center">
                  <Wallet className="h-4 w-4 mr-1" />
                  Bal: ${dashboard?.balance.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isFirstWithdrawal && (
                <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle>First Time Withdrawal</AlertTitle>
                  <AlertDescription className="text-xs mt-1 text-blue-700">
                    A one-time verification fee of $0.43 will be deducted from your first withdrawal.
                  </AlertDescription>
                </Alert>
              )}

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
                        <FormLabel>Amount (USD) - Min $1.00</FormLabel>
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
                  <Button type="submit" className="w-full" disabled={createWithdrawalMutation.isPending || (dashboard?.balance || 0) < form.watch("amount")}>
                    {createWithdrawalMutation.isPending ? "Processing..." : "Submit Withdrawal"}
                  </Button>
                  {(dashboard?.balance || 0) < form.watch("amount") && (
                    <p className="text-xs text-destructive text-center mt-2">Insufficient balance for this amount</p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Track your payout requests.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!withdrawals || withdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No withdrawal history found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">${withdrawal.amount.toFixed(2)}</span>
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md capitalize">
                            {withdrawal.method.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{withdrawal.accountName} <span className="text-slate-400 font-normal">({withdrawal.accountNumber})</span></p>
                        <p className="text-xs text-slate-400 mt-1">{format(new Date(withdrawal.createdAt), "MMM d, yyyy h:mm a")}</p>
                        {withdrawal.notes && withdrawal.status === 'rejected' && (
                          <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
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
