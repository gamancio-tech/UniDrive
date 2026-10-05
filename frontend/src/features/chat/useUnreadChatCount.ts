import { useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "../../api/chat";
import { getDecodedToken } from "../../api/client";
import { chatSocket, ChatSocketEvent } from "./chatSocket";

export function useUnreadChatCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = getDecodedToken();
  const role = user?.role;

  const refreshCount = useCallback(async () => {
    if (!role || role === "admin") return;

    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ignora falhas em background
    }
  }, [role]);

  useEffect(() => {
    refreshCount();

    const unsub = chatSocket.subscribe((event: ChatSocketEvent) => {
      if (event.type === "new_message" || event.type === "messages_read") {
        refreshCount();
      }
    });

    return () => {
      unsub();
    };
  }, [refreshCount]);

  return { unreadCount, refreshCount };
}
