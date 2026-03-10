import { useState } from "react";
import { useStore } from "@no-bs-framework/state";
import type { AppStore } from "../../types";
import { addComment } from "../../store/actions";

interface CommentFormProps {
  taskId: string;
}

export function CommentForm({ taskId }: CommentFormProps) {
  const $store = useStore<AppStore>();
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    // Default to first user for demo purposes
    addComment($store, taskId, "user-1", text.trim());
    setText("");
  };

  return (
    <div className="comment-form">
      <textarea
        placeholder="Add a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) handleSubmit();
        }}
      />
      <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
        Post
      </button>
    </div>
  );
}
