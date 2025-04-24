"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const response = await fetch("http://localhost:4000/host-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.status === 500) {
        alert(data.message);
      } else {
        if (data.id) {
          // Redirect to dashboard
          router.push(`/host/${data.id}/dashboard`);
        } else {
          console.error("No hostId returned from server.");
        }
      }
      // Assuming the server responds with JSON
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url(/grainy-3.jpg)] bg-no-repeat bg-cover">
      <div
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
        style={{ background: "rgba(76, 175, 80, 0.3)" }}
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Host login
        </h2>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-white">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-white hover:bg-purple-700 py-2 rounded-xl transition duration-300 text-black"
          >
            Log In
          </button>
        </form>
        <p className="text-center text-sm text-white mt-4">
          Don’t have an account?{" "}
          <a href="/host/sign-up" className="text-black hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
