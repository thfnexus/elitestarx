import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EliteStarXLogo } from "@/components/logo";
import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required (e.g. 03XXXXXXXXX)"),
  referralCode: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [autoFilledRef, setAutoFilledRef] = useState(false);
  
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", whatsappNumber: "", referralCode: "" },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get("ref");
    if (ref) {
      form.setValue("referralCode", ref);
      setAutoFilledRef(true);
    }
  }, [form]);
  
  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
        toast({ title: "Account created!", description: "Welcome to Elite Starx." });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({ 
          variant: "destructive", 
          title: "Registration failed", 
          description: error.data?.error || "Could not create account." 
        });
      }
    }
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mt-8 mb-4 animate-in fade-in zoom-in duration-700">
        <EliteStarXLogo size="lg" />
      </div>
      <Card className="w-full max-w-md shadow-lg border-border my-8">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription>Join Elite Starx and start growing your income</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} disabled={registerMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" type="email" {...field} disabled={registerMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" autoComplete="new-password" {...field} disabled={registerMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="03XXXXXXXXX" {...field} disabled={registerMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code {autoFilledRef ? "" : "(Optional)"}</FormLabel>
                    <FormControl>
                      {autoFilledRef ? (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                          <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="font-mono text-sm font-bold text-green-700 flex-1">{field.value}</span>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">Auto-filled</span>
                          <input type="hidden" {...field} />
                        </div>
                      ) : (
                        <Input placeholder="Enter code if you have one" {...field} disabled={registerMutation.isPending} />
                      )}
                    </FormControl>
                    {autoFilledRef && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        You were invited via a referral link — code applied automatically.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-6" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Register"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login">
              <span className="font-medium text-primary hover:underline cursor-pointer">Sign In</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
