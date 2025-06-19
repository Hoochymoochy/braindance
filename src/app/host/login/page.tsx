"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginHost } from "@/app/lib/auth/login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message);
      console.error("Login failed:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black thermal-background flex items-center justify-center">
      <div className="bg-black p-8 rounded-2xl border border-white/20 max-w-md w-full shadow-lg hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300">
        <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Host Login
        </h2>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full px-4 py-2 mt-1 rounded-md bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-purple-900/40 to-pink-900/70 border border-purple-500/70 hover:bg-gradient-to-br hover:from-purple-900/90 hover:to-pink-900/50 px-4 py-2 rounded-xl transition duration-300 text-white"
          >
            Log In
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          Don’t have an account?{" "}
          <a href="/host/sign-up" className="text-gray-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
