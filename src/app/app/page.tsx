import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Sign in — CivicKettle" };

async function RedirectIfSignedIn() {
  const supabase = await createClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/app/dashboard");
  }
  return null;
}

export default function SignInPage() {
  return (
    <div className="ck-site">
      <SiteHeader />
      <main className="ck-page ap-auth">
        <Suspense fallback={null}>
          <RedirectIfSignedIn />
        </Suspense>
        <div className="ap-auth-copy">
          <p className="ck-kicker">Coordinator sign-in</p>
          <h1>Your workspace.</h1>
          <p className="ck-intro">
            Sign in with the email you used when your organization joined CivicKettle.
          </p>
        </div>
        <SignInForm />
      </main>
      <SiteFooter />
    </div>
  );
}
