"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { loginSchema, type AuthActionState } from "@/lib/validation";

type LoginFormProps = {
  googleEnabled: boolean;
};

function ErrorText({ text }: { text?: string[] }) {
  if (!text?.length) {
    return null;
  }

  return <p className="text-sm text-red-300">{text[0]}</p>;
}

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthActionState>({});
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const validatedFields = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      setState({
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Check the highlighted fields and try again.",
      });
      return;
    }

    setState({});

    const result = await signIn("credentials", {
      email: validatedFields.data.email.toLowerCase(),
      password: validatedFields.data.password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (!result || result.error) {
      setState({
        message: "Invalid email or password.",
      });
      return;
    }

    router.push(result.url ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        action={(formData) => {
          startTransition(async () => {
            await handleSubmit(formData);
          });
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500"
            placeholder="name@example.com"
          />
          <ErrorText text={state.errors?.email} />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500"
            placeholder="Your password"
          />
          <ErrorText text={state.errors?.password} />
        </div>

        {state.message ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
        >
          Continue With Google
        </button>
      ) : (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Google login is disabled. Add `AUTH_GOOGLE_ID` and
          `AUTH_GOOGLE_SECRET` to enable it.
        </p>
      )}

      <p className="text-sm text-zinc-400">
        <Link href="/forgot-password" className="text-zinc-300 hover:text-zinc-100">
          Forgot password?
        </Link>
      </p>

      <p className="text-sm text-zinc-400">
        No account yet?{" "}
        <Link href="/register" className="text-emerald-300 hover:text-emerald-200">
          Create one
        </Link>
      </p>
    </div>
  );
}
