import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937,transparent_35%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-6 py-16 text-zinc-50">
      <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900/85 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          AlphaLedger
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Forgot Password
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Enter your email and we will send you a password reset link.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
