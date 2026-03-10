interface AvatarProps {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#059669", "#f59e0b", "#ef4444"];

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ initials, color, size = "md" }: AvatarProps) {
  const bg = color || hashColor(initials);
  const className = `avatar${size !== "md" ? ` avatar-${size}` : ""}`;

  return (
    <span className={className} style={{ background: bg }}>
      {initials}
    </span>
  );
}
