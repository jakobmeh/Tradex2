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

  return <p className="text-sm text-rose-200/90">{text[0]}</p>;
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
      callbackUrl: "/",
      redirect: false,
    });

    if (!result || result.error) {
      setState({
        message: result?.error ?? "Invalid email or password.",
      });
      return;
    }

    router.push(result.url ?? "/");
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
          <label htmlFor="email" className="text-sm text-[#f0ddb0]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-[0.95rem] border border-[#6f592d] bg-[#050505] px-4 py-3.5 text-sm text-[#f6f2e8] outline-none transition placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]"
            placeholder="name@example.com"
          />
          <ErrorText text={state.errors?.email} />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-[#f0ddb0]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-[0.95rem] border border-[#6f592d] bg-[#050505] px-4 py-3.5 text-sm text-[#f6f2e8] outline-none transition placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]"
            placeholder="Your password"
          />
          <ErrorText text={state.errors?.password} />
        </div>

        {state.message ? (
          <p className="rounded-[1rem] border border-rose-300/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-3.5 text-base font-semibold text-[#140d05] shadow-[0_14px_30px_rgba(169,124,40,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl: "/" })}
          className="inline-flex w-full items-center justify-center rounded-[1rem] border border-[#6f592d]/40 bg-[linear-gradient(180deg,rgba(22,22,22,0.95),rgba(8,8,8,0.96))] px-4 py-3.5 text-sm font-medium text-[#f3deb0] transition hover:border-[#9f7c3a]/55 hover:bg-[linear-gradient(180deg,rgba(28,28,28,0.96),rgba(10,10,10,0.98))]"
        >
          Continue With Google
        </button>
      ) : (
        <p className="rounded-[1rem] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
          Google login is disabled. Add `AUTH_GOOGLE_ID` and
          `AUTH_GOOGLE_SECRET` to enable it.
        </p>
      )}

      <div className="flex items-center justify-between gap-4 text-sm text-[#cdb991]/58">
        <Link href="/forgot-password" className="text-[#d8c79e]/72 transition hover:text-[#fff0c7]">
          Forgot password?
        </Link>
        <p>
          No account yet?{" "}
          <Link href="/register" className="text-[#e0bb6b] underline decoration-[#e0bb6b]/45 underline-offset-4 transition hover:text-[#fff0c7]">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
