"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { registerSchema, type AuthActionState } from "@/lib/validation";

function ErrorText({ text }: { text?: string[] }) {
  if (!text?.length) {
    return null;
  }

  return <p className="text-sm text-red-300">{text[0]}</p>;
}

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<AuthActionState>({});
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const rawValues = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validatedFields = registerSchema.safeParse(rawValues);

    if (!validatedFields.success) {
      setState({
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Check the highlighted fields and try again.",
      });
      return;
    }

    setState({});

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedFields.data),
    });

    const data = (await response.json()) as AuthActionState & { ok?: boolean };

    if (!response.ok) {
      setState({
        errors: data.errors,
        message: data.message ?? "Registration failed.",
      });
      return;
    }

    const result = await signIn("credentials", {
      email: validatedFields.data.email.toLowerCase(),
      password: validatedFields.data.password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (!result || result.error) {
      setState({
        message: "Account was created, but automatic login failed.",
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
          <label htmlFor="name" className="text-sm text-zinc-300">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-0 placeholder:text-zinc-500"
            placeholder="Your name"
          />
          <ErrorText text={state.errors?.name} />
        </div>

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
            placeholder="At least 8 characters"
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
          {pending ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-300 hover:text-emerald-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}
