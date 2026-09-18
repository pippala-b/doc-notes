"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    // Covers the app shell: the sidebar offset doesn't apply before sign-in.
    <div className="fixed inset-0 z-30 overflow-y-auto bg-background px-5">
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-5 pt-24">
      <header className="flex flex-col gap-1.5">
        <div className="eyebrow">Doc Notes · ABSITE</div>
        <h1 className="display">Sign in</h1>
        <p className="text-[0.95rem] text-ink-2">Enter the password you were given to open the app.</p>
      </header>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="gate-password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="gate-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
      </div>
      {error && <p className="card border-shaky p-3 text-sm">{error}</p>}
      <button type="submit" disabled={!password || busy} className="btn btn-primary">
        {busy ? "Checking…" : "Open the app"}
      </button>
    </form>
    </div>
  );
}
