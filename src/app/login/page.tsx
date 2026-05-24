import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">LLM Wrapper</h1>
          <p className="text-sm text-muted-foreground">
            Enter the site password to continue
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
