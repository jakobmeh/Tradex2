import Link from "next/link";
import { validatePasswordResetToken } from "@/lib/password-reset";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937,transparent_35%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-6 py-16 text-zinc-50">
        <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900/85 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <h1 className="text-3xl font-semibold tracking-tight">
            Invalid reset link
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            The password reset token is missing.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/forgot-password" className="text-emerald-300">
              Request a new reset link
            </Link>
          </p>
        </section>
      </main>
    );
  }

  const validToken = await validatePasswordResetToken(token);

  if (!validToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937,transparent_35%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-6 py-16 text-zinc-50">
        <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900/85 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <h1 className="text-3xl font-semibold tracking-tight">
            Reset link expired
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            This reset link is invalid or has expired. Request a new one.
          </p>
          <p className="mt-6 text-sm">
            <Link href="/forgot-password" className="text-emerald-300">
              Request a new reset link
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#1f2937,transparent_35%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-6 py-16 text-zinc-50">
      <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900/85 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          AlphaLedger
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Set New Password
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Choose a new password for your account.
        </p>
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
      </section>
    </main>
  );
}
