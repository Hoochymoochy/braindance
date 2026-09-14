"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginHost } from "@/app/lib/auth/login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const user = await loginHost(email, password);

      if (user?.id) {
        router.push(`/host/${user.id}/dashboard`);
      } else {
        setError("User login successful but ID not found.");
        console.error("User object:", user);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Login failed:", err.message);
      } else {
        setError("Unknown error occurred");
        console.error("Login failed with unknown error:", err);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-zinc-900">
      <div className="glass-bends w-full max-w-md rounded-2xl p-8 shadow-lg transition duration-300">
        <h2 className="mb-6 text-center text-3xl font-bold text-gradient-bends">
          Host Login
        </h2>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-brand-from/95">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-bends mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-brand-from/95">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-bends mt-1"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl border border-brand-to/50 bg-brand-to/80 px-4 py-2 text-zinc-950 transition duration-300 hover:bg-brand-via/75"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <a
            href="/host/sign-up"
            className="text-brand-from transition-colors hover:text-brand-via hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
