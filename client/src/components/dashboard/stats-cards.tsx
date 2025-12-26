import { Users, Bus, DollarSign, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { DashboardStats } from "@/types";

export type RevenuePeriod = 'daily' | 'weekly' | 'monthly';

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
  revenuePeriod?: RevenuePeriod;
  onPeriodChange?: (period: RevenuePeriod) => void;
}

function useAnimatedValue(endValue: number, duration: number = 2000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (endValue === 0) {
      setValue(0);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(endValue);
      return;
    }

    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(endValue * easeOutExpo));
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [endValue, duration]);

  return value;
}

export function StatsCards({ stats, isLoading, revenuePeriod = 'monthly', onPeriodChange }: StatsCardsProps) {
  const { userRole } = useAuth();
  
  const periodLabels = {
    daily: 'Receita Diária',
    weekly: 'Receita Semanal',
    monthly: 'Receita Mensal'
  };
  
  const animatedClients = useAnimatedValue(stats.totalClients, 1500);
  const animatedDestinations = useAnimatedValue(stats.activeDestinations, 1200);
  const animatedRevenue = useAnimatedValue(stats.monthlyRevenue, 2000);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: value >= 1000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
  };

  const allStatsData = [
    {
      id: "totalClients",
      title: "Total de Clientes",
      rawValue: stats.totalClients,
      animatedValue: animatedClients,
      icon: Users,
      change: "+12% este mês",
      changeType: "positive" as const,
      gradientFrom: "from-emerald-400",
      gradientTo: "to-green-500",
      bubbleColor: "from-emerald-400/30 to-green-500/20",
      iconBg: "from-emerald-500 to-green-600",
      accentColor: "text-emerald-600 dark:text-emerald-400",
      shadowColor: "shadow-emerald-500/20",
      formatter: (val: number) => val.toString(),
    },
    {
      id: "activeDestinations",
      title: "Destinos Ativos",
      rawValue: stats.activeDestinations,
      animatedValue: animatedDestinations,
      icon: Bus,
      change: "+5 novos",
      changeType: "positive" as const,
      gradientFrom: "from-cyan-400",
      gradientTo: "to-blue-500",
      bubbleColor: "from-cyan-400/30 to-blue-500/20",
      iconBg: "from-cyan-500 to-blue-600",
      accentColor: "text-cyan-600 dark:text-cyan-400",
      shadowColor: "shadow-cyan-500/20",
      formatter: (val: number) => val.toString(),
    },
    {
      id: "monthlyRevenue",
      title: periodLabels[revenuePeriod],
      rawValue: stats.monthlyRevenue,
      animatedValue: animatedRevenue,
      icon: DollarSign,
      change: "Parcelas + Transações",
      changeType: "positive" as const,
      gradientFrom: "from-violet-400",
      gradientTo: "to-purple-500",
      bubbleColor: "from-violet-400/30 to-purple-500/20",
      iconBg: "from-violet-500 to-purple-600",
      accentColor: "text-violet-600 dark:text-violet-400",
      shadowColor: "shadow-violet-500/20",
      formatter: formatCurrency,
    },
  ];
  
  const statsData = userRole === 'vadmin' 
    ? allStatsData 
    : allStatsData.filter(stat => stat.id !== "monthlyRevenue");

  if (isLoading) {
    const skeletonCount = userRole === 'vadmin' ? 3 : 2;
    return (
      <div className={`grid grid-cols-1 ${userRole === 'vadmin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-slate-200/50 to-slate-300/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-24 mb-4"></div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl w-32 mb-3"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
                </div>
                <div className="h-14 w-14 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {userRole === 'vadmin' && onPeriodChange && (
        <div className="flex justify-end mb-4 gap-2">
          {(['daily', 'weekly', 'monthly'] as RevenuePeriod[]).map((period) => (
            <Button
              key={period}
              variant={revenuePeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPeriodChange(period)}
              data-testid={`button-period-${period}`}
              className={`flex items-center gap-2 text-xs rounded-xl transition-all duration-300 ${
                revenuePeriod === period 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 border-0 shadow-lg shadow-emerald-500/30' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-3 w-3" />
              {period === 'daily' ? 'Diária' : period === 'weekly' ? 'Semanal' : 'Mensal'}
            </Button>
          ))}
        </div>
      )}
      
      <div className={`grid grid-cols-1 ${userRole === 'vadmin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {statsData.map((stat, index) => (
          <div 
            key={index} 
            data-testid={`stat-card-${index}`}
            className={`group relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl ${stat.shadowColor} border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1`}
          >
            {/* Bubble decorations */}
            <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${stat.bubbleColor} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
            <div className={`absolute -bottom-8 -left-8 w-28 h-28 bg-gradient-to-br ${stat.bubbleColor} rounded-full blur-xl opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>
            
            {/* Sparkle decoration */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Sparkles className={`h-4 w-4 ${stat.accentColor}`} />
            </div>
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p 
                  className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 tracking-wide"
                  data-testid={`text-stat-title-${index}`}
                >
                  {stat.title}
                </p>
                <p 
                  className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-white mb-3 tracking-tight"
                  data-testid={`text-stat-value-${index}`}
                >
                  {stat.formatter(stat.animatedValue)}
                </p>
                
                <div className={`flex items-center gap-2 ${stat.accentColor}`}>
                  <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-bold">{stat.change}</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.iconBg} rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity`}></div>
                <div className={`relative bg-gradient-to-br ${stat.iconBg} p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
            
            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradientFrom} ${stat.gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          </div>
        ))}
      </div>
    </>
  );
}
