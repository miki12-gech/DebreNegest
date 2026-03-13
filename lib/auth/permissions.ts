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
 * Validates if the user has permission to post.
 * SUPER_ADMIN -> can post
 * CLASS_ADMIN -> can post
 * MEMBER      -> can only view, like, comment, reply, and ask the Apostolic Father
 */
export const canPost = async () => {
    const role = await currentRole();
    return role === "SUPER_ADMIN" || role === "CLASS_ADMIN";
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
