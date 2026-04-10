"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpHost } from "@/app/lib/auth/sign-up";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const res = await signUpHost(email, password);

    if ("error" in res) {
      setError(res.error);
    } else {
      router.push(`/host/${res.id}/dashboard`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-white">
      <div className="glass-bends w-full max-w-md rounded-2xl p-8 shadow-lg transition duration-300">
        <h2 className="mb-6 text-center text-3xl font-bold text-gradient-bends">
          Create Account
        </h2>

        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-xl font-medium text-[#00ccff]/95">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-bends mt-1 placeholder:text-white/35"
              required
            />
          </div>
          <div>
            <label className="block text-xl font-medium text-[#00ccff]/95">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-bends mt-1 placeholder:text-white/35"
              required
            />
          </div>
          <div>
            <label className="block text-xl font-medium text-[#00ccff]/95">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-bends mt-1 placeholder:text-white/35"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl border border-[#3700ff]/50 bg-[#3700ff]/80 px-4 py-2 font-semibold text-white transition duration-300 hover:bg-[#ff00f7]/75"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/55">
          Already have an account?{" "}
          <a
            href="/host/login"
            className="text-[#ff00f7] transition-colors hover:text-[#00ccff]"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
