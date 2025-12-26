import { useAuth } from "@/hooks/use-auth";

interface ProtectedMoneyProps {
  amount: number;
  formatted?: string;
  className?: string;
}

export function ProtectedMoney({ amount, formatted, className = "" }: ProtectedMoneyProps) {
  const { userRole } = useAuth();
  
  // Hide money from normal admins (admin role), show to vadmins
  const isNormalAdmin = userRole === "admin";
  
  if (isNormalAdmin) {
    return <span className={`text-muted-foreground font-semibold ${className}`}>***</span>;
  }
  
  return <span className={className}>{formatted || amount.toString()}</span>;
}
