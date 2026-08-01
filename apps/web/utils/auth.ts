export type UserRole = "JMHV" | "SUPERADMIN" | "EDITOR" | "JOURNALIST" | "GUEST_WRITER";
export type ArticleStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export const ROLE_OPTIONS = [
  "JMHV",
  "SUPERADMIN",
  "EDITOR",
  "JOURNALIST",
  "GUEST_WRITER"
] as const satisfies readonly UserRole[];

export function isEditorialRole(role?: string | null) {
  return role === "JMHV" || role === "EDITOR" || role === "SUPERADMIN";
}

export function canManageUsers(role?: string | null) {
  return role === "JMHV" || role === "SUPERADMIN";
}

export function canManageAudience(role?: string | null) {
  return isEditorialRole(role);
}

export function canManageCategories(role?: string | null) {
  return isEditorialRole(role);
}

export function canDeleteCategories(role?: string | null) {
  return role === "JMHV" || role === "SUPERADMIN";
}

export function canManageClassifieds(role?: string | null) {
  return isEditorialRole(role);
}

export function canPublishClassifieds(role?: string | null) {
  return isEditorialRole(role);
}

export function canDeleteClassifieds(role?: string | null) {
  return role === "JMHV" || role === "SUPERADMIN";
}

export function isAuthorScopedRole(role?: string | null) {
  return role === "GUEST_WRITER" || role === "JOURNALIST";
}

export function canCreateArticles(role?: string | null) {
  return isAuthorScopedRole(role) || isEditorialRole(role);
}

export function canReviewArticles(role?: string | null) {
  return isEditorialRole(role);
}

export function canPublishArticles(role?: string | null) {
  return isEditorialRole(role);
}

export function canDeleteArticles(role?: string | null) {
  return role === "JMHV" || role === "SUPERADMIN";
}

export function canEditArticle(params: {
  role?: string | null;
  userId?: string | null;
  authorId?: string | null;
  status?: string | null;
}) {
  if (isEditorialRole(params.role)) return true;
  if (!params.userId || !params.authorId || params.userId !== params.authorId) return false;
  return params.status !== "APPROVED";
}

export function getNextStatusForSubmission(role?: string | null): ArticleStatus {
  return isEditorialRole(role) ? "APPROVED" : "IN_REVIEW";
}

export function roleLabel(role?: string | null) {
  switch (role) {
    case "JMHV":
      return "JMHV";
    case "SUPERADMIN":
      return "Super Admin";
    case "EDITOR":
      return "Editor";
    case "JOURNALIST":
      return "Journalist";
    case "GUEST_WRITER":
      return "Guest Writer";
    default:
      return "Guest";
  }
}

export function statusTone(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800";
    case "IN_REVIEW":
      return "bg-amber-100 text-amber-900";
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}