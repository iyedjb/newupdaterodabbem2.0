import { useAuth } from "@/hooks/use-auth";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "vadmin";
  host_plan_expiration_date?: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
}

export function PlanExpirationNotification() {
  const { userRole, user } = useAuth();

  // Fetch current user profile to get expiration date
  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No auth token");
      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return response.json();
    },
    enabled: userRole === "vadmin",
  });

  // Check if user is Daniel or Alda (by checking user email or name)
  const isAuthorizedUser = user?.email?.toLowerCase().includes("daniel") || 
                          user?.email?.toLowerCase().includes("alda") ||
                          user?.displayName?.toLowerCase().includes("daniel") ||
                          user?.displayName?.toLowerCase().includes("alda");

  // Check if today is between the 19th and 21st of the month
  const today = new Date();
  const dayOfMonth = today.getDate();
  const isReminderDay = dayOfMonth >= 19 && dayOfMonth <= 21;

  // Calculate remaining time until expiration
  const calculateRemainingTime = () => {
    if (!userProfile?.host_plan_expiration_date) return null;

    const expirationDate = new Date(userProfile.host_plan_expiration_date);
    const now = new Date();

    // Calculate the difference
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days: diffDays, hours: Math.abs(diffHours) };
  };

  const remaining = calculateRemainingTime();

  // Don't show notification if:
  // - User is not vadmin
  // - User is not Daniel or Alda
  // - Today is not between 19th-21st
  // - No expiration date is set
  if (userRole !== "vadmin" || !isAuthorizedUser || !isReminderDay || !remaining) {
    return null;
  }

  const expirationDate = new Date(userProfile!.host_plan_expiration_date!);
  const formattedDate = expirationDate.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // If already expired
  if (remaining.days < 0) {
    return (
      <div
        data-testid="notification-plan-expired"
        className="mb-8 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
              Plano Expirado
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              Seu plano de hospedagem expirou em {formattedDate}. Por favor, entre em contato
              com o suporte para renovar seu plano.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show reminder notification
  return (
    <div
      data-testid="notification-plan-expiration-reminder"
      className="mb-8 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl blur opacity-50"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">
            Lembrete: Plano de Hospedagem
          </h3>

          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2 leading-relaxed">
            Seu plano de hospedagem expira em{" "}
            <span className="font-semibold">{formattedDate}</span>. Você tem{" "}
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {remaining.days} dia{remaining.days !== 1 ? "s" : ""} e {remaining.hours} hora
              {remaining.hours !== 1 ? "s" : ""}
            </span>{" "}
            até a expiração. <span className="block mt-2 text-blue-700 dark:text-blue-300">💳 O pagamento será debitado no dia 21.</span>
          </p>

          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Calendar className="h-4 w-4" />
              <span>{expirationDate.toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Clock className="h-4 w-4" />
              <span>{expirationDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 italic">
            Dica: Considere renovar seu plano com antecedência para evitar interrupções de serviço.
          </p>

          <p className="text-xs text-blue-500 dark:text-blue-500 mt-3 px-3 py-2 bg-blue-100 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-800">
            ℹ️ Esta mensagem aparece apenas para Daniel ou Alda
          </p>
        </div>
      </div>
    </div>
  );
}
