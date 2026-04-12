import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <AuthShell
      title="Activate Your Personal AI Analyst"
      description="Your path to trading with systematic confidence starts now."
      chips={["Analyze", "Backtest", "AI Analyst"]}
      formTitle="Welcome Back"
      formDescription="Sign in to continue with your private AlphaLedger workspace or jump in with Google."
    >
      <LoginForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
