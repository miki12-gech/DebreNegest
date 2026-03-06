import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/Link";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-[450px] space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Create an account</h1>
                    <p className="text-gray-500">Join the Debere Negest community</p>
                </div>

                <div className="bg-white p-6 shadow-md border rounded-xl">
                    <RegisterForm />
                </div>

                <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-500 hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
