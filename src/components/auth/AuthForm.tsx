"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ActionResult } from "@/lib/actions/auth";

const initialState: ActionResult = { ok: true };

export function SignInForm({ action }: { action: (prev: ActionResult, formData: FormData) => Promise<ActionResult> }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Password" name="password" type="password" required autoComplete="current-password" />
        <Link href="/forgot-password" className="-mt-2 text-right font-body text-xs text-pine underline">
          Forgot your password?
        </Link>
        {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-5 text-center font-body text-sm text-ink/60">
        New here?{" "}
        <Link href="/signup" className="text-pine underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}

export function SignUpForm({ action }: { action: (prev: ActionResult, formData: FormData) => Promise<ActionResult> }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card className="p-6 sm:p-8">
      <form action={formAction} className="grid gap-5">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 10 characters."
        />
        {state.error && <p className="font-body text-sm text-red-700">{state.error}</p>}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center font-body text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="text-pine underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase text-ink/50">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        minLength={type === "password" ? 10 : undefined}
        className="input"
      />
      {hint && <span className="font-body text-xs text-ink/40">{hint}</span>}
    </label>
  );
}
