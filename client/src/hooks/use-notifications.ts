import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Notification } from "@shared/schema";

// OPTIMIZED: Only fetch unread on initial load, no constant polling
export function useNotifications() {
  const { idToken } = useAuth();
  
  return useQuery({
    queryKey: ["/api/notifications", idToken],
    queryFn: async () => {
      if (!idToken) return [];
      const response = await fetch("/api/notifications?unreadOnly=true", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        console.error("Notifications fetch failed:", response.status);
        return [];
      }
      return response.json() as Promise<Notification[]>;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: false, // IMPORTANT: No polling - fetch only on mount
    enabled: !!idToken,
  });
}

export function useMarkNotificationAsRead() {
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("PATCH", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}
