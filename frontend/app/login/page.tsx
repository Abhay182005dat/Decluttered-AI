"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
// import { MeteorBackground } from "@/components/MeteorBackground";
import { ArrowLeft, Mail, Lock, User, Sparkles } from "lucide-react";
import { SpaceWarpBackground } from "@/components/SpaceWarpBackground";


export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isSignUp ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      if (data.status === "success" || res.status === 201) {
        localStorage.setItem("decluttered_token", data.token);
        localStorage.setItem("decluttered_user", JSON.stringify(data.user));

        // Route based on onboarding status
        if (!data.user.onboarding_completed) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <SpaceWarpBackground />

      <div className="relative z-10 w-full max-w-md bg-[#161b22]/90 backdrop-blur-md border border-[#21262d] rounded-2xl p-8 shadow-2xl">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 bg-[#ff6600]/10 border border-[#ff6600]/30 text-[#ff6600] px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> DECLUTTERED INTEL
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold text-[#8b949e] uppercase mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-[#8b949e]" />
                <input
                  type="text"
                  required
                  placeholder="Abhay"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#ff6600] outline-none text-xs text-white pl-9 pr-3 py-2.5 rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#8b949e] uppercase mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#8b949e]" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#ff6600] outline-none text-xs text-white pl-9 pr-3 py-2.5 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8b949e] uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#8b949e]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#ff6600] outline-none text-xs text-white pl-9 pr-3 py-2.5 rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6600] hover:bg-[#e65c00] text-black font-bold py-2.5 rounded-lg text-xs transition-transform active:scale-[0.98] mt-2 shadow-lg shadow-orange-600/20"
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#21262d]"></div>
          </div>
          <span className="relative bg-[#161b22] px-3 text-[10px] text-[#8b949e] uppercase">
            Or continue with
          </span>
        </div>

        <div className="flex justify-center">
          <AuthButton />
        </div>

        <div className="mt-6 pt-4 border-t border-[#21262d] flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">
            {isSignUp ? "Already have an account?" : "Need an account?"}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-[#ff6600] hover:underline font-bold"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Intelligence Feed
          </Link>
        </div>
      </div>
    </div>
  );
}