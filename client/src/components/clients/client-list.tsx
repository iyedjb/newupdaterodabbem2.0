import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, Bus, AlertTriangle, CheckCircle, Phone, Mail, MapPin, Calendar, MoreHorizontal, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatCPF } from "@/lib/validation";
import type { Client, PaginationInfo } from "@/types";

interface ClientListProps {
  clients: Client[];
  pagination: PaginationInfo;
  isLoading?: boolean;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onPageChange: (page: number) => void;
  onNewTrip?: (client: Client) => void;
  onCancel?: (client: Client) => void;
}

export function getClientDataQuality(client: Client): { status: 'complete' | 'incomplete'; missingFields: string[] } {
  const requiredMissingFields: string[] = [];
  
  const isEmpty = (val: any) => !val || (typeof val === 'string' && val.trim() === '');
  
  if (isEmpty(client.cpf) || client.cpf === '00000000' || client.cpf === '000.000.000-00') requiredMissingFields.push('CPF');
  if (isEmpty(client.birthdate)) requiredMissingFields.push('Data Nascimento');
  if (isEmpty(client.destination)) requiredMissingFields.push('Destino');
  if (isEmpty(client.phone)) requiredMissingFields.push('Telefone');
  if (isEmpty(client.address)) requiredMissingFields.push('Endereço');
  
  if (requiredMissingFields.length === 0) {
    return { status: 'complete', missingFields: [] };
  } else {
    return { status: 'incomplete', missingFields: requiredMissingFields };
  }
}

const avatarGradients = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
];

function getAvatarGradient(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarGradients[hash % avatarGradients.length];
}

export function ClientList({
  clients,
  pagination,
  isLoading,
  onEdit,
  onDelete,
  onPageChange,
  onNewTrip,
  onCancel,
}: ClientListProps) {
  const { userRole } = useAuth();
  
  const getStatusBadge = (client: Client) => {
    if ((client as any).is_deleted) {
      const permanentDeleteAt = (client as any).permanent_delete_at;
      let daysRemaining = 0;
      if (permanentDeleteAt) {
        const deleteDate = new Date(permanentDeleteAt);
        const now = new Date();
        daysRemaining = Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">
          <Trash2 className="w-3 h-3" />
          Excluído {daysRemaining > 0 ? `(${daysRemaining} dias)` : ''}
        </span>
      );
    }
    if ((client as any).is_cancelled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold">
          <XCircle className="w-3 h-3" />
          Cancelado
        </span>
      );
    }
    
    const now = new Date();
    const travelDate = client.travel_date;
    
    if (!travelDate) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          Sem Data
        </span>
      );
    }
    
    const travelDateObj = typeof travelDate === 'string' ? new Date(travelDate) : travelDate;
    
    if (isNaN(travelDateObj.getTime())) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          Inválida
        </span>
      );
    }
    
    if (travelDateObj < now) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Embarcado
        </span>
      );
    } else if (travelDateObj.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Pendente
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Confirmado
        </span>
      );
    }
  };

  const getDataQualityIndicator = (client: Client) => {
    const { status, missingFields } = getClientDataQuality(client);
    
    if (status === 'complete') {
      return (
        <div 
          title="Todos os dados completos"
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900"
        >
          <CheckCircle className="h-3 w-3 text-white" />
        </div>
      );
    } else {
      return (
        <div 
          title={`Faltam: ${missingFields.join(', ')}`}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900 cursor-help"
        >
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>
      );
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl border border-white/50 dark:border-slate-700/50 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] p-12 shadow-xl border border-white/50 dark:border-slate-700/50 text-center overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-500/5 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum cliente encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400">Adicione seu primeiro cliente para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div className="col-span-3">Cliente</div>
        <div className="col-span-3">Contato</div>
        <div className="col-span-2">Destino</div>
        <div className="col-span-2">Viagem</div>
        <div className="col-span-2 text-right">Ações</div>
      </div>

      {/* Client Cards */}
      <div className="space-y-3">
        {clients.map((client, index) => {
          const { status } = getClientDataQuality(client);
          const fullName = `${client.first_name} ${client.last_name}`;
          const gradient = getAvatarGradient(fullName);
          const isCancelled = (client as any).is_cancelled;
          
          const cardBgClass = isCancelled
            ? 'bg-gradient-to-r from-slate-200/90 via-slate-100/80 to-slate-200/90 dark:from-slate-800/60 dark:via-slate-850/50 dark:to-slate-800/60 border-l-slate-400 dark:border-l-slate-500 opacity-60'
            : status === 'complete' 
              ? 'bg-gradient-to-r from-emerald-100/90 via-green-50/80 to-emerald-100/90 dark:from-emerald-900/40 dark:via-emerald-950/30 dark:to-emerald-900/40 border-l-emerald-500 dark:border-l-emerald-400' 
              : 'bg-gradient-to-r from-amber-100/90 via-yellow-50/80 to-amber-100/90 dark:from-amber-900/40 dark:via-amber-950/30 dark:to-amber-900/40 border-l-amber-500 dark:border-l-amber-400';
          
          const hoverBgClass = isCancelled
            ? 'hover:opacity-70'
            : status === 'complete'
              ? 'hover:from-emerald-200/95 hover:via-green-100/90 hover:to-emerald-200/95 dark:hover:from-emerald-800/50 dark:hover:via-emerald-900/40 dark:hover:to-emerald-800/50'
              : 'hover:from-amber-200/95 hover:via-yellow-100/90 hover:to-amber-200/95 dark:hover:from-amber-800/50 dark:hover:via-amber-900/40 dark:hover:to-amber-800/50';
          
          return (
            <div 
              key={client.id}
              data-testid={`client-row-${client.id}`}
              className={`group relative backdrop-blur-xl rounded-2xl border-l-4 border border-white/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden ${cardBgClass} ${hoverBgClass}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Inner bubble decorations */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-xl opacity-30 ${status === 'complete' ? 'bg-gradient-to-br from-emerald-400/30 to-green-500/20' : 'bg-gradient-to-br from-amber-400/30 to-yellow-500/20'}`}></div>
              <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-xl opacity-20 ${status === 'complete' ? 'bg-gradient-to-br from-green-400/30 to-teal-500/20' : 'bg-gradient-to-br from-yellow-400/30 to-orange-500/20'}`}></div>
              
              <div className="relative p-5 lg:p-6">
                {/* Mobile Layout */}
                <div className="lg:hidden space-y-4">
                  {/* Client Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className={`h-16 w-16 ring-4 ring-white dark:ring-slate-800 shadow-xl`}>
                        <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-lg`}>
                          {getInitials(client.first_name, client.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      {getDataQualityIndicator(client)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {formatCPF(client.cpf)}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(client)}
                      </div>
                    </div>
                    
                    {/* Actions Menu - Mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                        <DropdownMenuItem onClick={() => onEdit(client)} className="gap-2 py-3">
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {onNewTrip && (
                          <DropdownMenuItem onClick={() => onNewTrip(client)} className="gap-2 py-3">
                            <Bus className="h-4 w-4" />
                            Nova Viagem
                          </DropdownMenuItem>
                        )}
                        {onCancel && !isCancelled && (
                          <DropdownMenuItem 
                            onClick={() => onCancel(client)} 
                            className="gap-2 py-3 text-orange-600 dark:text-orange-400 focus:text-orange-600"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancelar Viagem
                          </DropdownMenuItem>
                        )}
                        {userRole === 'vadmin' && (
                          <>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="gap-2 py-3 text-red-600 dark:text-red-400 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este cliente e todos os dados relacionados?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(client.id)}
                                    className="bg-red-500 hover:bg-red-600 rounded-xl"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Contact & Destination Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Telefone</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{client.phone || '-'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Destino</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{client.destination || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout - Grid */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                  {/* Client Info */}
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className={`h-14 w-14 ring-4 ring-white dark:ring-slate-800 shadow-xl`}>
                        <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-base`}>
                          {getInitials(client.first_name, client.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      {getDataQualityIndicator(client)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {formatCPF(client.cpf)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Contact */}
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{client.phone || '-'}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 truncate text-xs">{client.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Destination */}
                  <div className="col-span-2">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800/50">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{client.destination || '-'}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">{client.duration} dias</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Travel Date & Status */}
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {client.travel_date ? formatDate(client.travel_date) : '-'}
                      </span>
                    </div>
                    {getStatusBadge(client)}
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-view-${client.id}`}
                      className="h-10 w-10 p-0 rounded-xl hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 transition-all hover:scale-110"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onNewTrip && (
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-new-trip-${client.id}`}
                        onClick={() => onNewTrip(client)}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/50 transition-all hover:scale-110"
                        title="Nova Viagem"
                      >
                        <Bus className="h-4 w-4" />
                      </Button>
                    )}
                    {onCancel && !isCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-cancel-${client.id}`}
                        onClick={() => onCancel(client)}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-900/50 transition-all hover:scale-110"
                        title="Cancelar Viagem"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-edit-${client.id}`}
                      onClick={() => onEdit(client)}
                      className="h-10 w-10 p-0 rounded-xl hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/50 transition-all hover:scale-110"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {userRole === 'vadmin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-delete-${client.id}`}
                            className="h-10 w-10 p-0 rounded-xl hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 transition-all hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este cliente e todos os dados relacionados?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(client.id)}
                              className="bg-red-500 hover:bg-red-600 rounded-xl"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 dark:border-slate-700/50 mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Mostrando <span className="font-bold text-blue-600 dark:text-blue-400">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> a{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> de{' '}
              <span className="font-bold text-slate-900 dark:text-white">{pagination.totalItems}</span> clientes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                data-testid="button-prev-page"
                className="h-10 px-3 rounded-xl border-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.currentPage;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                      className={isActive 
                        ? "h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg text-white font-bold" 
                        : "h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                data-testid="button-next-page"
                className="h-10 px-3 rounded-xl border-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show total count when all clients are displayed */}
      {pagination.totalPages <= 1 && clients.length > 0 && (
        <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 dark:border-slate-700/50 mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <span className="font-bold text-blue-600 dark:text-blue-400">{pagination.totalItems}</span>
              <span className="text-blue-600 dark:text-blue-400">clientes</span>
            </span>
            exibidos
          </div>
        </div>
      )}
    </div>
  );
}
