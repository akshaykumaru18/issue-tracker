import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="app-shell flex flex-1 flex-col">
      <header className="app-header">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h1 className="heading1">Sign in</h1>
          <Link href="/" className="btn btn-ghost w-full no-underline sm:w-auto">
            Back to issues
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="w-full max-w-lg">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
