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

    if (res.error) {
      setError(res.error);
    } else {
      router.push(`/host/${res.id}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-black thermal-background flex items-center justify-center">
      <div className="bg-black p-8 rounded-lg border border-purple-900/50 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Create Account
        </h2>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSignUp} className="space-y-5">
          <div>
            <label className="block text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30"
              required
            />
          </div>
          <div>
            <label className="block text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30"
              required
            />
          </div>
          <div>
            <label className="block text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-purple-900/40 to-pink-900/70 border border-purple-500/70 hover:bg-gradient-to-br hover:from-purple-900/90 hover:to-pink-900/50 px-4 py-2 rounded-xl transition duration-300 text-white"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{" "}
          <a href="/host/login" className="text-gray-500 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
