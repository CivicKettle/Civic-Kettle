"use server";

import { redirect } from "next/navigation";
import { createClient, siteUrl } from "@/lib/supabase/server";

export type SignInState = {
  status: "idle" | "sent" | "error" | "unconfigured";
  message?: string;
  email?: string;
};

export async function sendSignInLink(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Enter the email you use for your organization." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      status: "unconfigured",
      email,
      message: "Sign-in isn't switched on yet. The database connection is still being set up.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/app/auth/callback` },
  });

  if (error) {
    return { status: "error", email, message: error.message };
  }
  return { status: "sent", email };
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/app");
}
