import { useEffect, useState } from "react";
import { Plus, FileText, BookOpen, Sparkles, TrendingUp, Headphones, Bell, ArrowRight, Zap, Target, Award } from "lucide-react";
import { useLocation } from "wouter";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { useDashboardStats } from "@/hooks/use-reports";
import { useTutorial } from "@/contexts/TutorialContext";
import { AtendimentoClienteModal } from "@/components/atendimento-modal";
import { useNotifications, useMarkNotificationAsRead } from "@/hooks/use-notifications";
import { PlanExpirationNotification } from "@/components/dashboard/plan-expiration-notification";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type RevenuePeriod = 'daily' | 'weekly' | 'monthly';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { activeStep, completeTutorialStep } = useTutorial();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('monthly');
  const [atendimentoModalOpen, setAtendimentoModalOpen] = useState(false);
  const { data: stats, isLoading } = useDashboardStats(revenuePeriod);
  const { data: notifications = [] } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (activeStep === 'dashboard') {
      const timer = setTimeout(() => {
        completeTutorialStep('dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeStep, completeTutorialStep]);

  const defaultStats = {
    totalClients: 0,
    activeDestinations: 0,
    monthlyRevenue: 0,
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Floating Bubbles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large gradient bubbles */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-emerald-400/30 via-green-300/20 to-teal-400/30 rounded-full blur-3xl animate-pulse" style={{animationDuration: '8s'}}></div>
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-gradient-to-br from-cyan-400/20 via-blue-300/15 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-green-400/20 via-emerald-300/15 to-teal-400/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '12s', animationDelay: '4s'}}></div>
          
          {/* Smaller accent bubbles */}
          <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-br from-yellow-400/40 to-orange-400/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-400/30 to-rose-400/20 rounded-full blur-2xl"></div>
          <div className="absolute top-2/3 right-1/4 w-20 h-20 bg-gradient-to-br from-violet-400/30 to-purple-400/20 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10">
          {/* Modern Glass Header */}
          <header className="mb-10">
            <div className="relative">
              {/* Glass card with bubble effect */}
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-emerald-500/10 border border-white/50 dark:border-slate-700/50 overflow-hidden">
                {/* Inner bubbles */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-br from-teal-400/20 to-cyan-500/10 rounded-full blur-2xl"></div>
                
                <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur-lg opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-2xl shadow-lg">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-4 py-1.5 rounded-full">
                        Painel Principal
                      </span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent tracking-tight mb-3">
                      Dashboard
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium max-w-md">
                      Visão completa e em tempo real do seu negócio de viagens
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Notification Button */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          data-testid="button-notifications"
                          className="group relative bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-4 rounded-2xl transition-all duration-300 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105"
                        >
                          <div className="relative">
                            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 transition-colors" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-bounce">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 max-h-96 overflow-y-auto rounded-2xl border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                        <div className="space-y-2">
                          <h3 className="font-bold text-lg mb-4">Notificações</h3>
                          {notifications.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">Nenhuma notificação</p>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => markAsRead.mutate(notification.id)}
                                className={`p-3 rounded-xl cursor-pointer transition-all ${
                                  notification.read
                                    ? "bg-slate-100 dark:bg-slate-800"
                                    : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700"
                                }`}
                              >
                                <p className="font-semibold text-sm">{notification.title}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(notification.created_at).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Atendimento Button */}
                    <button
                      onClick={() => setAtendimentoModalOpen(true)}
                      data-testid="button-atendimento-header"
                      className="group flex items-center gap-3 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
                    >
                      <Headphones className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      <span>Atendimento</span>
                    </button>

                    {/* Date Display */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 text-center min-w-[100px]">
                      <div className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                        {new Date().toLocaleDateString('pt-BR', { day: '2-digit' })}
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        {new Date().toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Plan Expiration Notification */}
          <PlanExpirationNotification />

          {/* Stats Cards Section */}
          <section className="mb-10">
            <StatsCards 
              stats={stats || defaultStats} 
              isLoading={isLoading}
              revenuePeriod={revenuePeriod}
              onPeriodChange={setRevenuePeriod}
            />
          </section>

          {/* Quick Actions - Modern Bubble Cards */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur-lg opacity-40"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-2xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                  Ações Rápidas
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Acesse as principais funções</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Client Card */}
              <div 
                onClick={() => setLocation("/clients/new")}
                data-testid="button-add-new-client"
                className="group cursor-pointer"
              >
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-emerald-500/10 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.02] hover:-translate-y-1">
                  {/* Bubble decoration */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-cyan-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl shadow-lg inline-block">
                        <Plus className="h-8 w-8 text-white group-hover:rotate-90 transition-transform duration-500" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Adicionar Cliente
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Cadastre novos clientes rapidamente
                    </p>
                    
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <span>Começar agora</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports Card */}
              <div 
                onClick={() => setLocation("/reports")}
                data-testid="button-generate-report"
                className="group cursor-pointer"
              >
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-blue-500/10 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-1">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg inline-block">
                        <FileText className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Gerar Relatório
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Análises e métricas detalhadas
                    </p>
                    
                    <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <span>Ver relatórios</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Card */}
              <div 
                onClick={() => setLocation("/manual")}
                data-testid="button-open-manual"
                className="group cursor-pointer"
              >
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl shadow-violet-500/10 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/20 hover:scale-[1.02] hover:-translate-y-1">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-violet-400/30 to-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-violet-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-2xl shadow-lg inline-block">
                        <BookOpen className="h-8 w-8 text-white group-hover:rotate-6 transition-transform duration-500" />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      Manual de Uso
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Aprenda todas as funcionalidades
                    </p>
                    
                    <div className="flex items-center text-violet-600 dark:text-violet-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <span>Explorar manual</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Decorative Element */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-full px-6 py-3 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <Award className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Sistema de Gestão de Viagens
              </span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>
      </div>
      <AtendimentoClienteModal open={atendimentoModalOpen} onOpenChange={setAtendimentoModalOpen} />
    </>
  );
}

