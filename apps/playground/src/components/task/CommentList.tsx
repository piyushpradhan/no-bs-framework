import { useStore } from "@no-bs-framework/state";
import type { AppStore, Comment, User } from "../../types";
import { Avatar } from "../shared/Avatar";

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  const $store = useStore<AppStore>();

  if (comments.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No comments yet.</p>;
  }

  return (
    <div>
      {comments.map((comment) => {
        const user = $store.users[comment.userId] as User | undefined;
        return (
          <div key={comment.id} className="comment-item">
            <Avatar initials={user?.avatar ?? "?"} size="sm" />
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-author">{user?.name ?? "Unknown"}</span>
                <span className="comment-time">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="comment-text">{comment.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
