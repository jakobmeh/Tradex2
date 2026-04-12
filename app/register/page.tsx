import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <AuthShell
      title="Activate Your Personal AI Analyst"
      description="Your path to trading with systematic confidence starts now."
      chips={["Analyze", "Backtest", "AI Analyst"]}
      formTitle="Create Account"
      formDescription="Register with email, verify the 6-digit code, and unlock your private trading workspace."
    >
      <RegisterForm />
    </AuthShell>
  );
}
