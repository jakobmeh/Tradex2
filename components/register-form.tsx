"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import {
  registerSchema,
  registerVerificationSchema,
  type AuthActionState,
} from "@/lib/validation";

function ErrorText({ text }: { text?: string[] }) {
  if (!text?.length) {
    return null;
  }

  return <p className="text-sm text-rose-200/90">{text[0]}</p>;
}

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<AuthActionState>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  async function requestVerificationCode(formData: FormData) {
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
    setSuccessMessage("");

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

    setPendingSignup({
      name: validatedFields.data.name,
      email: validatedFields.data.email.toLowerCase(),
      password: validatedFields.data.password,
    });
    setVerificationStep(true);
    setCode("");
    setSuccessMessage(
      data.message ?? "We sent a 6-digit verification code to your email.",
    );
  }

  async function verifyCode() {
    if (!pendingSignup) {
      setState({
        message: "Start registration again to request a new verification code.",
      });
      setVerificationStep(false);
      return;
    }

    const validatedFields = registerVerificationSchema.safeParse({
      email: pendingSignup.email,
      code,
    });

    if (!validatedFields.success) {
      setState({
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Enter the 6-digit verification code.",
      });
      return;
    }

    setState({});
    setSuccessMessage("");

    const response = await fetch("/api/register/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedFields.data),
    });

    const data = (await response.json()) as AuthActionState & {
      ok?: boolean;
      message?: string;
    };

    if (!response.ok) {
      setState({
        errors: data.errors,
        message: data.message ?? "Verification failed.",
      });
      return;
    }

    const result = await signIn("credentials", {
      email: pendingSignup.email,
      password: pendingSignup.password,
      callbackUrl: "/",
      redirect: false,
    });

    if (!result || result.error) {
      setState({
        message: result?.error ?? "Email was verified, but automatic login failed.",
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
            if (verificationStep) {
              await verifyCode();
              return;
            }

            await requestVerificationCode(formData);
          });
        }}
        className="space-y-4"
      >
        {verificationStep ? (
          <div className="space-y-4">
            <div className="rounded-[1rem] border border-[#c39a48]/28 bg-[#a8791c]/12 px-4 py-3 text-sm text-[#fff0cb]">
              Verification code sent to <span className="font-medium">{pendingSignup?.email}</span>.
            </div>

            <div className="space-y-2">
              <label htmlFor="code" className="text-sm text-[#f0ddb0]">
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className="h-14 w-full rounded-[0.95rem] border border-[#6f592d] bg-[#050505] px-4 py-0 text-sm leading-none tracking-[0.3em] text-[#f6f2e8] outline-none transition placeholder:leading-none placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]"
                placeholder="123456"
              />
              <ErrorText text={state.errors?.code} />
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-[#f0ddb0]">
                First Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="h-14 w-full rounded-[0.95rem] border border-[#6f592d] bg-[#050505] px-4 py-0 text-sm leading-none text-[#f6f2e8] outline-none transition placeholder:leading-none placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]"
                placeholder="Jakob"
              />
              <ErrorText text={state.errors?.name} />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-[#f0ddb0]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="h-14 w-full rounded-[0.95rem] border border-[#6f592d] bg-[#050505] px-4 py-0 text-sm leading-none text-[#f6f2e8] outline-none transition placeholder:leading-none placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]"
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
                className="h-14 w-full rounded-[0.95rem] border border-[#6f592d] bg-[#050505] px-4 py-0 text-sm leading-none text-[#f6f2e8] outline-none transition placeholder:leading-none placeholder:text-[#b59e6d]/40 focus:border-[#d9b15c] focus:bg-[#090909] focus:shadow-[0_0_0_3px_rgba(196,149,58,0.12)]"
                placeholder="At least 8 characters"
              />
              <ErrorText text={state.errors?.password} />
            </div>

            <label className="flex items-start gap-3 rounded-[1rem] border border-[#6f592d]/30 bg-[linear-gradient(180deg,rgba(18,18,18,0.95),rgba(8,8,8,0.96))] px-4 py-3 text-sm text-[#dbc8a0]/78">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border border-[#c7a257] bg-transparent accent-[#c89c49]"
              />
              <span>
                I agree to the Terms and Conditions{" "}
                <span className="text-[#e0bb6b] underline decoration-[#e0bb6b]/45 underline-offset-4">
                  Terms and Conditions
                </span>
              </span>
            </label>
          </>
        )}

        {state.message ? (
          <p className="rounded-[1rem] border border-rose-300/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {state.message}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-[1rem] border border-[#c39a48]/28 bg-[#a8791c]/12 px-4 py-3 text-sm text-[#fff0cb]">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-14 w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(90deg,#8b6122,#d5aa5e,#f0d289)] px-4 py-0 text-base font-semibold text-[#140d05] shadow-[0_14px_30px_rgba(169,124,40,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending
            ? verificationStep
              ? "Verifying..."
              : "Sending Code..."
            : verificationStep
              ? "Verify Email"
              : "Create Account"}
        </button>

        {verificationStep ? (
          <button
            type="button"
            disabled={pending || !pendingSignup}
            onClick={() => {
              startTransition(async () => {
                if (!pendingSignup) return;

                setState({});
                setSuccessMessage("");

                const response = await fetch("/api/register", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(pendingSignup),
                });

                const data = (await response.json()) as AuthActionState & {
                  message?: string;
                };

                if (!response.ok) {
                  setState({
                    errors: data.errors,
                    message: data.message ?? "Could not resend the verification code.",
                  });
                  return;
                }

                setSuccessMessage(
                  data.message ?? "A new verification code has been sent.",
                );
              });
            }}
            className="inline-flex h-14 w-full items-center justify-center rounded-[1rem] border border-[#6f592d]/40 bg-[linear-gradient(180deg,rgba(22,22,22,0.95),rgba(8,8,8,0.96))] px-4 py-0 text-sm font-medium text-[#f3deb0] transition hover:border-[#9f7c3a]/55 hover:bg-[linear-gradient(180deg,rgba(28,28,28,0.96),rgba(10,10,10,0.98))] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Resend Code
          </button>
        ) : null}
      </form>

      <p className="text-center text-sm text-[#cdb991]/58">
        Already a user?{" "}
        <Link href="/login" className="text-[#e0bb6b] underline decoration-[#e0bb6b]/45 underline-offset-4 transition hover:text-[#fff0c7]">
          Sign In
        </Link>
      </p>
    </div>
  );
}
