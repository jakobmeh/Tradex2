import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#14532d,transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-6 py-16 text-zinc-50">
      <section className="w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900/85 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
          Tradex
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Create Account
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Create a local account first. After that, you can also sign in with
          Google when the Google env variables are configured.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
