import { auth } from "@/auth";

export const currentUser = async () => {
    const session = await auth();
    return session?.user;
};

export const currentRole = async () => {
    const session = await auth();
    return session?.user?.role;
};

// --- Permission Checks ---

export const isSuperAdmin = async () => {
    const role = await currentRole();
    return role === "SUPER_ADMIN";
};

export const isClassAdminOrHigher = async () => {
    const role = await currentRole();
    return role === "SUPER_ADMIN" || role === "CLASS_ADMIN";
};

/**
 * Validates if the user has permission to post to a class.
 * SUPER_ADMIN -> globally valid
 * CLASS_ADMIN -> valid
 * MEMBER      -> valid
 */
export const canPost = async () => {
    const user = await currentUser();
    return !!user; // For now all authenticated users can post to their classes
};

/**
 * To delete a post:
 * 1. Must be the author
 * 2. OR be a SUPER_ADMIN
 * 3. OR be a CLASS_ADMIN of that specific class (to be evaluated individually per class)
 */
export const canDeletePost = async (authorId: string, userRole: string, userId: string) => {
    if (userRole === "SUPER_ADMIN") return true;
    if (authorId === userId) return true;
    return false;
}
