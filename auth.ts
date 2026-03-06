import NextAuth from "next-auth";
import { auth, handlers, signIn, signOut } from "./lib/auth/config";

export { auth, handlers, signIn, signOut };
