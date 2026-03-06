import NextAuth from "next-auth";
import { auth as configAuth } from "./lib/auth/config";

// Wrap your edge-compatible NextAuth methods here.
// Note: We avoid importing Prisma Adapter in edge environments like Middleware.

const { auth } = NextAuth({
    providers: [], // Providers are not used in middleware, only session decoding
    session: { strategy: "jwt" },
});

// Protect specified routes
export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    const publicRoutes = ["/login", "/register", "/", "/api/uploadthing"];
    const authRoutes = ["/login", "/register"]; // Routes to redirect away from if logged in

    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);
    const isApiRoute = nextUrl.pathname.startsWith("/api");
    const isAdminRoute = nextUrl.pathname.startsWith("/admin");

    if (isApiRoute) {
        return; // Don't redirect API routes
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL("/feed", nextUrl));
        }
        return; // Allow unauthenticated access to login/register
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/login", nextUrl));
    }

    if (isAdminRoute) {
        if (req.auth?.user?.role !== "SUPER_ADMIN") {
            return Response.redirect(new URL("/feed", nextUrl));
        }
    }

    return;
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
