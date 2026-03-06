import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { Cross } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-orthodox-darker orthodox-pattern">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orthodox-gold/10 border border-orthodox-gold/20">
                            <Cross className="h-7 w-7 text-orthodox-gold" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-orthodox-parchment">Join the Community</h1>
                    <p className="text-orthodox-parchment/50 text-sm">Create your ደብረ ነገስት account</p>
                </div>

                <div className="p-6 rounded-xl border border-orthodox-gold/10 bg-orthodox-dark/80 backdrop-blur-sm shadow-2xl">
                    <RegisterForm />
                </div>

                <div className="text-center text-sm text-orthodox-parchment/50">
                    Already have an account?{" "}
                    <Link href="/login" className="text-orthodox-gold hover:text-orthodox-gold-light transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
