"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPasswordSchema, type AuthActionState } from "@/lib/validation";

function ErrorText({ text }: { text?: string[] }) {
  if (!text?.length) {
    return null;
  }

  return <p className="text-sm text-red-300">{text[0]}</p>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<AuthActionState>({});
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const validatedFields = resetPasswordSchema.safeParse({
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      setState({
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Password does not meet the requirements.",
      });
      return;
    }

    setState({});

    const response = await fetch("/api/password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password: validatedFields.data.password,
      }),
    });

    const data = (await response.json()) as AuthActionState & { ok?: boolean };

    if (!response.ok) {
      setState({
        errors: data.errors,
        message: data.message ?? "Could not reset password.",
      });
      return;
    }

    router.push("/login?reset=success");
    router.refresh();
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
          <label htmlFor="password" className="text-sm text-zinc-300">
            New password
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
          {pending ? "Saving..." : "Set New Password"}
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
