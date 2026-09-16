"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  email: string;
  picture: string;
  onboarding_completed?: boolean;
}

export default function AuthButton() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  useEffect(() => {
    const savedUser = localStorage.getItem("decluttered_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("decluttered_token", data.token);
        localStorage.setItem("decluttered_user", JSON.stringify(data.user));
        setUser(data.user);

        if (!data.user.onboarding_completed) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("decluttered_token");
    localStorage.removeItem("decluttered_user");
    setUser(null);
    router.push("/");
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 font-mono">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-7 h-7 rounded-full border border-[#30363d]"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#ff6600] text-black flex items-center justify-center font-bold text-xs">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
        )}
        <span className="text-xs font-medium text-gray-200 hidden sm:inline">{user.name}</span>
        <button
          onClick={handleLogout}
          className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log("Login Failed")}
      theme="filled_black"
      size="medium"
    />
  );
}