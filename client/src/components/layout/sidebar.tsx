import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NavSearch } from "@/components/nav-search";
import { CredentialsModal } from "@/components/credentials-modal";
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  Plane,
  Shield,
  LogOut,
  User,
  MapPin,
  PiggyBank,
  Target,
  Activity,
  Bus,
  BookOpen,
  Receipt,
  Wallet,
  Calendar,
  Building2,
  Clock,
  History,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Key,
  Sparkles,
  CreditCard,
  UserPlus,
  Trash2
} from "lucide-react";
import { useState, useMemo } from "react";

function CompanyLogo({ size = 40 }: { size?: number }) {
  return (
    <div 
      className="flex-shrink-0 flex items-center justify-center" 
      style={{ width: size, height: size }}
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 to-green-500/30 rounded-full blur-md group-hover:blur-lg transition-all duration-500"></div>
        <div 
          className="relative rounded-full border-2 border-[#6CC24A] flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg shadow-emerald-500/20"
          style={{ width: size, height: size }}
        >
          <div className="bg-gradient-to-br from-[#6CC24A] to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-inner">
            R
          </div>
        </div>
      </div>
    </div>
  );
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavCategory {
  name: string;
  icon: any;
  items: NavItem[];
}

const navigationCategories: (NavItem | NavCategory)[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Atendimento do Cliente",
    icon: Users,
    items: [
      {
        name: "Criar Contrato",
        href: "/clients/new",
        icon: FileText,
      },
      {
        name: "Clientes cadastrados",
        href: "/clients",
        icon: Users,
      },
      {
        name: "Clientes Interessados",
        href: "/prospects",
        icon: UserPlus,
        badge: "Novo",
      },
      {
        name: "Histórico de Clientes",
        href: "/client-history",
        icon: History,
      },
      {
        name: "Indicações",
        href: "/indicacoes",
        icon: Users,
      },
      {
        name: "Destinos",
        href: "/destinations",
        icon: MapPin,
      },
      {
        name: "Programa de Viagens",
        href: "/programa-viagens",
        icon: Calendar,
      },
      {
        name: "Descrição de Ônibus",
        href: "/buses",
        icon: Bus,
      },
    ],
  },
  {
    name: "Finanças",
    icon: PiggyBank,
    items: [
      {
        name: "Caixa",
        href: "/caixa",
        icon: PiggyBank,
      },
      {
        name: "Parcelas",
        href: "/parcelas",
        icon: Wallet,
      },
      {
        name: "Pagamentos de Clientes",
        href: "/receipts",
        icon: Receipt,
      },
      {
        name: "Créditos",
        href: "/creditos",
        icon: CreditCard,
      },
    ],
  },
  {
    name: "CRM",
    icon: Briefcase,
    items: [
      {
        name: "Tarefas",
        href: "/crm",
        icon: Briefcase,
      },
      {
        name: "Calendário",
        href: "/crm/calendar",
        icon: Calendar,
      },
      {
        name: "Controle de Ponto",
        href: "/controle-de-ponto",
        icon: Clock,
      },
      {
        name: "Atividade Usuários",
        href: "/user-activity",
        icon: Activity,
      },
      {
        name: "Aniversário Clientes",
        href: "/client-birthdays",
        icon: Calendar,
      },
      {
        name: "Clientes Excluídos",
        href: "/deleted-clients",
        icon: Trash2,
      },
    ],
  },
  {
    name: "Setor RH",
    icon: Users,
    items: [
      {
        name: "Funcionários",
        href: "/funcionarios",
        icon: Users,
      },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, userRole, logout } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Atendimento do Cliente", "Finanças"])
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const isCategory = (item: NavItem | NavCategory): item is NavCategory => {
    return 'items' in item;
  };

  const getVisibleNavigation = () => {
    if (userRole === 'vadmin') {
      return navigationCategories;
    } else {
      const allowedPaths = ['/', '/clients', '/client-history', '/prospects', '/destinations', '/buses', '/programa-viagens', '/caixa', '/parcelas', '/receipts', '/creditos', '/controle-de-ponto', '/crm', '/crm/calendar', '/funcionarios', '/client-birthdays'];
      
      return navigationCategories.filter(item => {
        if (isCategory(item)) {
          return item.items.some(subItem => allowedPaths.includes(subItem.href));
        } else {
          return allowedPaths.includes(item.href);
        }
      }).map(item => {
        if (isCategory(item)) {
          return {
            ...item,
            items: item.items.filter(subItem => allowedPaths.includes(subItem.href))
          };
        }
        return item;
      });
    }
  };

  const visibleNav = getVisibleNavigation();
  const allPages = useMemo(() => {
    const pages: Array<{ name: string; href: string; category: string }> = [];
    
    visibleNav.forEach((item) => {
      if (isCategory(item)) {
        item.items.forEach((subItem) => {
          pages.push({
            name: subItem.name,
            href: subItem.href,
            category: item.name,
          });
        });
      } else {
        pages.push({
          name: item.name,
          href: item.href,
          category: "General",
        });
      }
    });
    
    return pages;
  }, [visibleNav]);

  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);

  return (
    <>
      <CredentialsModal isOpen={isCredentialsOpen} onClose={() => setIsCredentialsOpen(false)} />
      <aside className="relative w-64 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/30 flex flex-col overflow-hidden">
        {/* Background bubble decorations */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -left-16 w-32 h-32 bg-gradient-to-br from-emerald-300/15 to-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-20 -right-10 w-40 h-40 bg-gradient-to-br from-green-400/15 to-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header section */}
        <div className="relative p-5 space-y-4">
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-slate-700/40 shadow-lg shadow-emerald-500/5">
            {/* Header bubble accent */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-full blur-xl"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CompanyLogo size={40} />
                <div className="flex flex-col">
                  <h1 className="text-lg font-black bg-gradient-to-r from-[#6CC24A] to-emerald-600 bg-clip-text text-transparent leading-tight tracking-tight">
                    RODA BEM
                  </h1>
                  <h2 className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 leading-tight">
                    TURISMO
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsCredentialsOpen(true)}
                className="relative p-2 rounded-xl bg-white/80 dark:bg-slate-700/80 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 border border-white/50 dark:border-slate-600/50"
                data-testid="button-credentials"
                title="Ver Senhas e Contatos"
              >
                <Key className="h-4 w-4 text-[#6CC24A]" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center font-medium tracking-wide">
              sua melhor companhia
            </p>
          </div>
          
          {/* Search box */}
          <div className="relative" style={{ zIndex: 100 }}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-500/10 rounded-xl blur-sm"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/50 dark:border-slate-700/50 shadow-sm p-0.5">
              <NavSearch pages={allPages} />
            </div>
          </div>
        </div>
        
        {/* Navigation section */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-200/50 dark:scrollbar-thumb-emerald-800/50 scrollbar-track-transparent" style={{ zIndex: 1 }}>
          <ul className="space-y-1.5">
            {visibleNav.map((item) => {
              if (isCategory(item)) {
                const isExpanded = expandedCategories.has(item.name);
                const hasActiveChild = item.items.some(subItem => 
                  location === subItem.href || (subItem.href !== "/" && location.startsWith(subItem.href))
                );
                
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggleCategory(item.name)}
                      data-testid={`nav-category-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-left rounded-2xl transition-all duration-300 text-sm font-semibold group",
                        "hover:bg-white/70 dark:hover:bg-slate-800/70 hover:shadow-md hover:shadow-emerald-500/10",
                        "border border-transparent hover:border-white/40 dark:hover:border-slate-700/40",
                        hasActiveChild && "bg-white/60 dark:bg-slate-800/60 border-emerald-200/50 dark:border-emerald-800/50 shadow-sm"
                      )}
                    >
                      <div className="flex items-center">
                        <div className={cn(
                          "p-1.5 rounded-lg mr-3 transition-all duration-300",
                          "bg-emerald-100/50 dark:bg-emerald-900/30 group-hover:bg-emerald-200/70 dark:group-hover:bg-emerald-800/50",
                          hasActiveChild && "bg-emerald-200/70 dark:bg-emerald-800/50"
                        )}>
                          <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300">{item.name}</span>
                      </div>
                      <div className={cn(
                        "p-1 rounded-lg transition-all duration-300",
                        "bg-slate-100/50 dark:bg-slate-800/50 group-hover:bg-emerald-100/50 dark:group-hover:bg-emerald-900/30"
                      )}>
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <ul className="mt-1.5 ml-2 space-y-1 pl-4 border-l-2 border-emerald-200/50 dark:border-emerald-800/30">
                        {item.items.map((subItem) => {
                          const isActive = location === subItem.href || 
                            (subItem.href !== "/" && location.startsWith(subItem.href));
                          
                          return (
                            <li key={subItem.name}>
                              <Link href={subItem.href}>
                                <button
                                  data-testid={`nav-${subItem.name.toLowerCase().replace(/\s+/g, '-')}`}
                                  className={cn(
                                    "w-full flex items-center px-3 py-2.5 text-left rounded-xl transition-all duration-300 text-xs font-medium group",
                                    "hover:bg-white/70 dark:hover:bg-slate-800/70",
                                    isActive && "bg-gradient-to-r from-[#6CC24A] to-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02] border-0"
                                  )}
                                >
                                  <div className={cn(
                                    "p-1 rounded-lg mr-2.5 transition-all duration-300",
                                    !isActive && "bg-slate-100/50 dark:bg-slate-800/50 group-hover:bg-emerald-100/50 dark:group-hover:bg-emerald-900/30",
                                    isActive && "bg-white/20"
                                  )}>
                                    <subItem.icon className={cn(
                                      "h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110",
                                      !isActive && "text-slate-500 dark:text-slate-400",
                                      isActive && "text-white"
                                    )} />
                                  </div>
                                  <span className={cn(
                                    !isActive && "text-slate-600 dark:text-slate-400"
                                  )}>{subItem.name}</span>
                                  {subItem.badge && !isActive && (
                                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-green-400 text-white rounded-full shadow-sm">
                                      {subItem.badge}
                                    </span>
                                  )}
                                  {isActive && (
                                    <Sparkles className="h-3 w-3 ml-auto text-white/70" />
                                  )}
                                </button>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              } else {
                const isActive = location === item.href || 
                  (item.href !== "/" && location.startsWith(item.href));
                
                return (
                  <li key={item.name}>
                    <Link href={item.href}>
                      <button 
                        data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className={cn(
                          "w-full flex items-center px-4 py-3 text-left rounded-2xl transition-all duration-300 text-sm font-semibold group",
                          "hover:bg-white/70 dark:hover:bg-slate-800/70 hover:shadow-md hover:shadow-emerald-500/10",
                          "border border-transparent hover:border-white/40 dark:hover:border-slate-700/40",
                          isActive && "bg-gradient-to-r from-[#6CC24A] to-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02] border-0"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg mr-3 transition-all duration-300",
                          !isActive && "bg-emerald-100/50 dark:bg-emerald-900/30 group-hover:bg-emerald-200/70 dark:group-hover:bg-emerald-800/50",
                          isActive && "bg-white/20"
                        )}>
                          <item.icon className={cn(
                            "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                            !isActive && "text-emerald-600 dark:text-emerald-400",
                            isActive && "text-white"
                          )} />
                        </div>
                        <span className={cn(
                          "text-xs",
                          !isActive && "text-slate-700 dark:text-slate-300"
                        )}>{item.name}</span>
                        {isActive && (
                          <Sparkles className="h-3.5 w-3.5 ml-auto text-white/70" />
                        )}
                      </button>
                    </Link>
                  </li>
                );
              }
            })}
          </ul>
        </nav>
        
        {/* Footer section */}
        <div className="relative p-4 space-y-3">
          {/* Footer bubble accent */}
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          {/* User info card */}
          <div className="relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-3 border border-white/40 dark:border-slate-700/40 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 shadow-inner">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate flex-1">{user?.email}</span>
            </div>
          </div>
          
          {/* Logout button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md hover:bg-red-50/80 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-300 rounded-xl text-xs font-medium shadow-sm border-white/40 dark:border-slate-700/40 hover:shadow-md" 
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sair
          </Button>
          
          {/* Security badge */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50/80 to-green-50/80 dark:from-emerald-950/40 dark:to-green-950/40 backdrop-blur-sm rounded-xl p-2.5 border border-emerald-200/30 dark:border-emerald-800/30">
            <div className="absolute -right-2 -top-2 w-8 h-8 bg-emerald-400/20 rounded-full blur-lg"></div>
            <div className="relative flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">Dados criptografados</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

