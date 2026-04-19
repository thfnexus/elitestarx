import { useGetDeposits, useCreateDeposit, CreateDepositBodyMethod } from "@workspace/api-client-react";
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
import { getGetDepositsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Lock } from "lucide-react";

const FIXED_PKR = 800;
const PKR_TO_USD_RATE = 280;
const FIXED_USD = parseFloat((FIXED_PKR / PKR_TO_USD_RATE).toFixed(4));

const depositSchema = z.object({
  method: z.enum(["jazzcash", "easypaisa", "bank_transfer"] as const),
  transactionRef: z.string().min(3, "Transaction reference is required"),
  senderName: z.string().min(2, "Sender name is required"),
  senderNumber: z.string().min(5, "Sender number/account is required"),
});

type DepositForm = z.infer<typeof depositSchema>;

const PAYMENT_DETAILS = {
  jazzcash: { name: "JazzCash", details: "0300-1234567 (Elite Starx)" },
  easypaisa: { name: "EasyPaisa", details: "0345-1234567 (Elite Starx Official)" },
  bank_transfer: { name: "Bank Transfer", details: "Meezan Bank: 01234567890 (Elite Starx)" },
};

export default function Deposits() {
  const { data: deposits, isLoading } = useGetDeposits();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      method: "jazzcash",
      transactionRef: "",
      senderName: "",
      senderNumber: "",
    },
  });

  const selectedMethod = form.watch("method");

  const createDepositMutation = useCreateDeposit({
    mutation: {
      onSuccess: () => {
        toast({ title: "Deposit request submitted", description: "Your deposit is pending admin approval." });
        form.reset({ method: "jazzcash", transactionRef: "", senderName: "", senderNumber: "" });
        queryClient.invalidateQueries({ queryKey: getGetDepositsQueryKey() });
      },
      onError: (error) => {
        toast({ 
          variant: "destructive", 
          title: "Failed to submit", 
          description: error.data?.error || "Could not submit deposit request." 
        });
      }
    }
  });

  const onSubmit = (data: DepositForm) => {
    createDepositMutation.mutate({
      data: {
        method: data.method as CreateDepositBodyMethod,
        amount: FIXED_USD,
        transactionRef: data.transactionRef,
        senderNumber: `${data.senderName} | ${data.senderNumber}`,
      }
    });
  };

  if (isLoading) {
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
        <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50">Account Activation</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Pay the one-time activation fee to unlock the platform and start earning.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-12 lg:col-span-5 space-y-6">
          <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="font-black text-slate-900 dark:text-slate-50">Activation Fee Payment</CardTitle>
              <CardDescription className="dark:text-slate-400 font-medium text-xs">Send the exact 800 PKR amount, then submit the transaction reference below for approval.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/40 rounded-3xl p-6 mb-6 text-center">
                <p className="text-[10px] font-black text-primary/70 dark:text-primary/80 uppercase tracking-widest mb-2">Fixed Deposit Amount</p>
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <span className="text-5xl font-black text-primary">800</span>
                    <span className="text-xl font-bold text-primary ml-1">PKR</span>
                  </div>
                  <div className="text-slate-400 text-2xl font-light">≈</div>
                  <div className="text-left">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-50">${FIXED_USD}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-black uppercase tracking-tighter">USD Value</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
                  <Lock className="h-3 w-3" />
                  <span>Fixed Rate: Rs.{PKR_TO_USD_RATE}/$</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 mb-6">
                <p className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">
                  Send to — {PAYMENT_DETAILS[selectedMethod].name}
                </p>
                <p className="text-lg font-black text-blue-950 dark:text-blue-50 font-mono tracking-tight bg-white/50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/50 dark:border-blue-900/50">
                  {PAYMENT_DETAILS[selectedMethod].details}
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
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
                    name="transactionRef"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID / Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123456789012" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name on account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Account / Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 0300-1234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary hover:bg-primary/90 !text-white font-black text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-100 disabled:bg-primary/80" 
                    disabled={createDepositMutation.isPending}
                  >
                    {createDepositMutation.isPending ? "Submitting..." : "Submit Activation Claim (800 PKR)"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-12 lg:col-span-7">
          <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 h-full">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              <CardTitle className="font-black text-slate-900 dark:text-slate-50">Payment History</CardTitle>
              <CardDescription className="dark:text-slate-400 font-medium text-xs">Track your previous activation fee submissions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!deposits || deposits.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No deposit history found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-slate-900 dark:text-slate-50">800 PKR</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black">(${deposit.amount.toFixed(2)} USD)</span>
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md capitalize uppercase tracking-tighter">
                            {deposit.method.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold mb-1 font-mono tracking-tighter">Ref: {deposit.transactionRef}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{format(new Date(deposit.createdAt), "MMM d, yyyy h:mm a")}</p>
                        {deposit.notes && deposit.status === 'rejected' && (
                          <p className="text-xs text-destructive mt-2 bg-destructive/10 dark:bg-destructive/20 p-2 rounded border border-destructive/20">
                            Reason: {deposit.notes}
                          </p>
                        )}
                      </div>
                      <div>
                        {getStatusBadge(deposit.status)}
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
