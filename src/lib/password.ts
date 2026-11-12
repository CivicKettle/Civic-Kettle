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
