import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/Link";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-[400px] space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Welcome back</h1>
                    <p className="text-gray-500">Sign in to your account</p>
                </div>

                <div className="bg-white p-6 shadow-md border rounded-xl">
                    <LoginForm />
                </div>

                <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-blue-500 hover:underline">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
}
