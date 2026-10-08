"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/app/lib/auth/login";
import { signUpUser } from "@/app/lib/auth/sign-up";
import { establishAuthCookie } from "@/app/lib/auth/establishAuthCookie";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: AuthMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    if (mode === "signup") {
      if (!confirmPassword) {
        setError("All fields are required");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const user = await loginUser(email, password);
        if (!user?.id) {
          setError("Login succeeded but user ID was not found.");
          return;
        }
      } else {
        const res = await signUpUser(email, password);
        if ("error" in res) {
          setError(res.error);
          return;
        }
      }

      await establishAuthCookie();
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-bends w-full max-w-md rounded-2xl p-8 shadow-lg transition duration-300">
      <div className="mb-6 flex rounded-xl border border-black/10 p-1 dark:border-brand-from/20">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-bends-fast ease-bends",
            mode === "login"
              ? "bg-brand-to/80 text-zinc-950"
              : "text-zinc-600 hover:text-brand-from dark:text-zinc-300"
          )}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-bends-fast ease-bends",
            mode === "signup"
              ? "bg-brand-to/80 text-zinc-950"
              : "text-zinc-600 hover:text-brand-from dark:text-zinc-300"
          )}
        >
          Sign up
        </button>
      </div>

      <h1 className="mb-6 text-center text-3xl font-bold text-gradient-bends">
        {mode === "login" ? "Welcome back" : "Create account"}
      </h1>

      {error ? (
        <p className="mb-4 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="auth-email"
            className="block text-lg font-medium text-brand-from/95"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-bends mt-1"
            required
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="block text-lg font-medium text-brand-from/95"
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-bends mt-1"
            required
          />
        </div>

        {mode === "signup" ? (
          <div>
            <label
              htmlFor="auth-confirm-password"
              className="block text-lg font-medium text-brand-from/95"
            >
              Confirm password
            </label>
            <input
              id="auth-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-bends mt-1"
              required
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl border border-brand-to/50 bg-brand-to/80 px-4 py-2 font-semibold text-zinc-950 transition duration-300 hover:bg-brand-via/75 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? mode === "login"
              ? "Logging in…"
              : "Creating account…"
            : mode === "login"
              ? "Log in"
              : "Sign up"}
        </button>
      </form>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="glass-bends w-full max-w-md rounded-2xl p-8 shadow-lg">
      <div className="mb-6 h-10 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
      <div className="mx-auto mb-6 h-9 w-48 animate-pulse rounded bg-black/5 dark:bg-white/10" />
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
        <div className="h-16 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
        <div className="h-10 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-zinc-900 dark:text-zinc-100">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
