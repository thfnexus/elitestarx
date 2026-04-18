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
  jazzcash: { name: "JazzCash", details: "0300-1234567 (EarnHub)" },
  easypaisa: { name: "EasyPaisa", details: "0345-1234567 (EarnHub Official)" },
  bank_transfer: { name: "Bank Transfer", details: "Meezan Bank: 01234567890 (EarnHub)" },
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deposits</h1>
        <p className="text-slate-500 mt-1">Add funds to your account via local payment methods.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-5 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle>New Deposit</CardTitle>
              <CardDescription>Send the exact amount below, then submit the form with your transaction ID.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-center">
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">Fixed Deposit Amount</p>
                <div className="flex items-center justify-center gap-3">
                  <div>
                    <span className="text-4xl font-extrabold text-primary">800</span>
                    <span className="text-xl font-bold text-primary ml-1">PKR</span>
                  </div>
                  <div className="text-slate-400 text-sm">≈</div>
                  <div className="text-slate-600">
                    <span className="text-xl font-bold">${FIXED_USD}</span>
                    <span className="text-xs text-slate-400 block">USD</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-500">
                  <Lock className="h-3 w-3" />
                  <span>Fixed amount — Rate: Rs.{PKR_TO_USD_RATE}/$</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Send to — {PAYMENT_DETAILS[selectedMethod].name}
                </p>
                <p className="text-base font-bold text-blue-900 font-mono tracking-tight">
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
                  <Button type="submit" className="w-full" disabled={createDepositMutation.isPending}>
                    {createDepositMutation.isPending ? "Submitting..." : "Submit Deposit Request (800 PKR)"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Deposit History</CardTitle>
              <CardDescription>Track your past deposit requests.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!deposits || deposits.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No deposit history found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">800 PKR</span>
                          <span className="text-xs text-slate-400">(${deposit.amount.toFixed(2)})</span>
                          <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md capitalize">
                            {deposit.method.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mb-1">Ref: {deposit.transactionRef}</p>
                        <p className="text-xs text-slate-400">{format(new Date(deposit.createdAt), "MMM d, yyyy h:mm a")}</p>
                        {deposit.notes && deposit.status === 'rejected' && (
                          <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
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
