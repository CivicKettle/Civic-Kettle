import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import SignInForm from "./SignInForm";

export const metadata: Metadata = { title: "Sign in — CivicKettle" };

export const dynamic = "force-dynamic";

async function RedirectIfSignedIn() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    }
  } catch {
    // Never let an auth hiccup take down the sign-in page.
  }
  if (signedIn) redirect("/app/dashboard");
  return null;
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; new?: string; email?: string }> }) {
  const { error, new: isNew, email } = await searchParams;
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
            Sign in with your email and password. If you forgot the password, we can email you a sign-in link.
          </p>
        </div>
        <SignInForm linkError={error === "link"} startWithLink={Boolean(isNew)} defaultEmail={(email || "").slice(0, 200)} />
      </main>
      <SiteFooter />
    </div>
  );
}
