interface EmptyStateProps {
  icon?: string;
  title: string;
  text?: string;
}

export function EmptyState({ icon = "~", title, text }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {text && <div className="empty-state-text">{text}</div>}
    </div>
  );
}
