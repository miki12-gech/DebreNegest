import type { DefaultSession } from "next-auth";

// The `next-auth` module augmentation must be defined at the top level
declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's postal address. */
            id: string;
            role: string;
            fullName?: string | null;
            image?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        fullName?: string | null;
    }
}
