import { useAuth } from "@/lib/auth";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  component: Component,
  requireAdmin = false,
  path,
}: {
  component: React.ComponentType<any>;
  requireAdmin?: boolean;
  path: string;
}) {
  return (
    <Route path={path}>
      {(params) => {
        const { user, isLoading } = useAuth();

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/login" />;
        }

        if (requireAdmin && !user.isAdmin) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
          );
        }

        return <Component params={params} />;
      }}
    </Route>
  );
}
