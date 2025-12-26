import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: number;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "warning",
      title: "Premium Features Available",
      message: "Análise de ROI e Previsão de Vendas disponíveis no plano Premium",
      timestamp: "Há 15 minutos",
      isRead: false
    },
    {
      id: 2,
      type: "success",
      title: "Performance Excepcional",
      message: "Taxa de conversão de 68% ultrapassou a meta mensal em 13%",
      timestamp: "Há 45 minutos",
      isRead: false
    },
    {
      id: 3,
      type: "info",
      title: "Satisfação Recorde",
      message: "Satisfação do cliente atingiu 92% - melhor resultado do ano",
      timestamp: "Há 1 hora",
      isRead: false
    },
    {
      id: 4,
      type: "success",
      title: "Retenção Excelente",
      message: "84% de retenção de clientes - acima da média do setor",
      timestamp: "Há 2 horas",
      isRead: true
    },
    {
      id: 5,
      type: "warning",
      title: "Relatórios Pendentes",
      message: "3 relatórios financeiros aguardam revisão para este mês",
      timestamp: "Há 3 horas",
      isRead: true
    },
    {
      id: 6,
      type: "info",
      title: "Sistema Atualizado",
      message: "Dashboard otimizado com novos insights de performance",
      timestamp: "Há 5 horas",
      isRead: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <X className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "warning":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "error":
        return "bg-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-white/20 dark:border-slate-700/50">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-amber-500/5 dark:from-amber-400/10 dark:via-orange-400/10 dark:to-amber-400/10 rounded-lg"></div>
      
      <CardHeader className="relative pb-4">
        <CardTitle className="flex items-center justify-between text-slate-800 dark:text-white">
          <div className="flex items-center">
            <div className="bg-amber-500/20 p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform relative">
              <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </div>
            <div>
              <span className="text-lg lg:text-xl font-bold">Notificações</span>
              <div className="flex items-center mt-1">
                <Info className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {unreadCount} não lidas
                </span>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative pt-2">
        <div className="space-y-3 max-h-96">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`flex items-start gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer
                ${notification.isRead 
                  ? 'bg-white/30 dark:bg-slate-700/30' 
                  : 'bg-white/60 dark:bg-slate-700/60 ring-2 ring-blue-500/20'
                } hover:bg-white/80 dark:hover:bg-slate-700/80`}
              onClick={() => markAsRead(notification.id)}
              data-testid={`notification-${notification.id}`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${getNotificationColors(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                  {notification.message}
                </p>
                <Badge variant="outline" className="text-xs mt-2">
                  {notification.timestamp}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-1 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium transition-colors">
            Ver todas as notificações →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}