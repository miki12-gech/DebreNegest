import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import { Cross } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-orthodox-darker orthodox-pattern">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orthodox-gold/10 border border-orthodox-gold/20">
                            <Cross className="h-7 w-7 text-orthodox-gold" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-orthodox-parchment">Welcome Back</h1>
                    <p className="text-orthodox-parchment/50 text-sm">Sign in to your ደብረ ነገስት account</p>
                </div>

                <div className="p-6 rounded-xl border border-orthodox-gold/10 bg-orthodox-dark/80 backdrop-blur-sm shadow-2xl">
                    <LoginForm />
                </div>

                <div className="text-center text-sm text-orthodox-parchment/50">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-orthodox-gold hover:text-orthodox-gold-light transition-colors">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
}
