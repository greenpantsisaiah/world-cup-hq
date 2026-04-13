import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectUrl = `${siteUrl}/admin`;

  // Create the redirect response first so we can set cookies on it
  const response = NextResponse.redirect(redirectUrl);
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set on the response so cookies survive the redirect
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // PKCE flow: exchange code for session
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Email OTP / magic link verification via token_hash
  const ALLOWED_OTP_TYPES = ["email", "magiclink", "signup", "recovery"];
  if (tokenHash && type && ALLOWED_OTP_TYPES.includes(type)) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "magiclink" | "signup" | "recovery",
    });
  }

  return response;
}
