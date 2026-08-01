// apps/web/components/admin/UserAvatar.tsx
function getInitials(name?: string | null) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "NN";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "NN";
}


export function UserAvatar({
  name,
  avatar,
  size = 48
}: {
  name?: string | null;
  avatar?: string | null;
  size?: number;
}) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name ? `${name}'s profile photo` : "Profile photo"}
        className="shrink-0 rounded-full border border-zinc-200 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-950 font-semibold uppercase text-white"
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}