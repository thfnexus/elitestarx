import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Wallet from "@/pages/wallet";
import Ads from "@/pages/ads";
import Team from "@/pages/team";
import Deposits from "@/pages/deposits";
import Withdrawals from "@/pages/withdrawals";
import Rewards from "@/pages/rewards";
import LiveFeed from "@/pages/live-feed";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/:rest*">
        <Layout>
          <Switch>
            <ProtectedRoute path="/dashboard" component={Dashboard} />
            <ProtectedRoute path="/wallet" component={Wallet} />
            <ProtectedRoute path="/ads" component={Ads} />
            <ProtectedRoute path="/team" component={Team} />
            <ProtectedRoute path="/deposits" component={Deposits} />
            <ProtectedRoute path="/withdrawals" component={Withdrawals} />
            <ProtectedRoute path="/rewards" component={Rewards} />
            <ProtectedRoute path="/live-feed" component={LiveFeed} />
            <ProtectedRoute path="/admin" component={Admin} requireAdmin={true} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
