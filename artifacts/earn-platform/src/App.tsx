import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import Layout from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import LiveNotifications from "@/components/LiveNotifications";
import { ThemeProvider } from "@/components/theme-provider";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Wallet from "@/pages/wallet";
import Ads from "@/pages/ads";
import Team from "@/pages/team";
import Deposits from "@/pages/deposits";
import Withdrawals from "@/pages/withdrawals";
import Rewards from "@/pages/rewards";
import Admin from "@/pages/admin";
import EarningsGuide from "@/pages/earnings-guide";
import JoinWhatsApp from "@/pages/join-whatsapp";
import Profile from "@/pages/profile";
import Bonus from "@/pages/bonus";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
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
            <ProtectedRoute path="/earnings-guide" component={EarningsGuide} />
            <ProtectedRoute path="/join-whatsapp" component={JoinWhatsApp} />
            <ProtectedRoute path="/profile" component={Profile} />
            <ProtectedRoute path="/bonus" component={Bonus} />
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
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
              <LiveNotifications />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
          <SonnerToaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
