import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/env";

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <MailCheck className="h-8 w-8 text-emerald-400" />
      </div>

      <div>
        <h1 className="font-heading text-2xl text-ivory-100">Verify Your Email</h1>
        <p className="mt-2 font-body text-sm text-obsidian-400">
          We&apos;ve sent a verification link to your email address. Please click the link to
          activate your {appConfig.name} account.
        </p>
      </div>

      <div className="rounded-md border border-obsidian-700 bg-obsidian-900/50 p-4 text-left">
        <p className="font-body text-xs text-obsidian-400">
          Didn&apos;t receive the email? Check your spam folder or contact{" "}
          <a
            href={`mailto:${appConfig.supportEmail}`}
            className="text-gold-400 hover:text-gold-300"
          >
            {appConfig.supportEmail}
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/login">
          <Button variant="luxury" className="w-full">
            Continue to Sign In
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
