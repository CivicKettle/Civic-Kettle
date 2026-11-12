/** The rules for a password, in one place. Returns a message, or null if it's fine. */
export function passwordProblem(password: string, again: string): string | null {
  if (password.length < 8) return "Use at least 8 characters for the password.";
  if (password.length > 72) return "Keep the password under 72 characters.";
  if (password !== again) return "The two passwords don't match.";
  return null;
}

/** Turn the sign-in provider's wording into something a person can act on. */
export function passwordErrorMessage(message: string): string {
  return /different from the old/i.test(message)
    ? "That's already your password."
    : /reauth|recent/i.test(message)
      ? "For safety, sign out, sign back in with an emailed link, then set the password."
      : /weak|should contain|at least/i.test(message)
        ? "That password is too easy to guess. Try a longer one."
        : message;
}

type PasswordClient = {
  auth: { updateUser: (attrs: { password?: string; data?: Record<string, unknown> }) => Promise<{ error: { message: string; code?: string } | null }> };
};

/**
 * Save the password an account is created with, and record that it has one.
 * If the person types the password they already have (they set one before
 * passwords were required), that counts: we just record that it exists.
 * Returns a message to show, or null when it worked.
 */
export async function saveFirstPassword(supabase: PasswordClient, password: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password, data: { has_password: true } });
  if (!error) return null;
  if (error.code === "same_password" || /different from the old/i.test(error.message)) {
    const { error: flagError } = await supabase.auth.updateUser({ data: { has_password: true } });
    return flagError ? passwordErrorMessage(flagError.message) : null;
  }
  return passwordErrorMessage(error.message);
}
