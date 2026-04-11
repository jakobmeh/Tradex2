"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { forgotPasswordSchema, type AuthActionState } from "@/lib/validation";

function ErrorText({ text }: { text?: string[] }) {
  if (!text?.length) {
    return null;
  }

  return <p className="text-sm text-red-300">{text[0]}</p>;
}

export function ForgotPasswordForm() {
  const [state, setState] = useState<AuthActionState>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const validatedFields = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!validatedFields.success) {
      setSuccessMessage("");
      setState({
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Enter a valid email address.",
      });
      return;
    }

    setState({});

    const response = await fetch("/api/password/forgot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedFields.data),
    });

    const data = (await response.json()) as AuthActionState;

    if (!response.ok) {
      setSuccessMessage("");
      setState({
        errors: data.errors,
        message: data.message ?? "Could not send the reset email.",
      });
      return;
    }

    setState({});
    setSuccessMessage(
      data.message ??
        "If an account with that email exists, a password reset link has been sent.",
    );
  }

  return (
    <div className="space-y-6">
      <form
        action={(formData) =>
          startTransition(async () => {
            await handleSubmit(formData);
          })
        }
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

        {state.message ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {state.message}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="text-sm text-zinc-400">
        Back to{" "}
        <Link href="/login" className="text-emerald-300 hover:text-emerald-200">
          login
        </Link>
      </p>
    </div>
  );
}
