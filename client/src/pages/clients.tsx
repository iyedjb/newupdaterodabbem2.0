import { useState, useEffect } from "react";
import { Plus, Users, MapPin, Calendar, Building2, Plane, Search as SearchIcon, Link as LinkIcon, Copy, Check, CheckCircle, AlertTriangle, AlertCircle, Share2, Mail, XCircle, Wrench } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientList, getClientDataQuality } from "@/components/clients/client-list";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { useDestinations } from "@/hooks/use-destinations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTutorial } from "@/contexts/TutorialContext";
import { TutorialHighlight } from "@/components/tutorial/TutorialHighlight";
import type { FilterOptions, Client } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Clients() {
  const [, setLocation] = useLocation();
  const { activeStep, completeTutorialStep } = useTutorial();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const isVadmin = userRole === 'vadmin';
  const [showClientTypeDialog, setShowClientTypeDialog] = useState(false);
  const [selectedClientType, setSelectedClientType] = useState<'agencia' | 'operadora' | null>(null);
  const [showOperatorDialog, setShowOperatorDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedInvType, setSelectedInvType] = useState<'agencia' | 'operadora' | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [clientToCancel, setClientToCancel] = useState<Client | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    limit: 99999,
    sortBy: 'created_at',
  });

  const { clients, pagination, isLoading } = useClients(filters);
  const deleteClient = useDeleteClient();
  const { data: destinations } = useDestinations();

  const createInvitationLink = async () => {
    try {
      if (!user) {
        toast({ title: 'Erro', description: 'Você precisa estar logado', variant: 'destructive' });
        return;
      }
      
      const token = await user.getIdToken();
      const body: any = {
        client_type: selectedInvType,
        expires_in_days: 30,
      };
      if (selectedInvType === 'operadora') body.operator_name = selectedOperator;
      if (selectedDestination && selectedDestination !== '__none__') {
        body.destination = selectedDestination;
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      const fullLink = `${window.location.origin}/invite/${data.link_token}`;
      setInvitationLink(fullLink);
    } catch (error) {
      console.error('Error creating invitation link:', error);
      toast({ title: 'Erro', description: 'Não foi possível gerar o link', variant: 'destructive' });
    }
  };

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (activeStep === 'view-clients') {
      const timer = setTimeout(() => {
        completeTutorialStep('view-clients');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeStep, completeTutorialStep]);

  const handleEdit = (client: Client) => {
    setLocation(`/clients/${client.id}/edit`);
  };

  const handleDelete = (clientId: string) => {
    deleteClient.mutate(clientId);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleNewTrip = (client: Client) => {
    const personalInfoOnly = {
      ...client,
      destination: '',
      travel_price: undefined,
      duration: 1,
      travel_date: undefined,
      down_payment: undefined,
      down_payment_method: undefined,
      installments_count: undefined,
      installment_due_date: undefined,
      first_installment_due_date: undefined,
      payment_method: undefined,
      departure_location: '',
      return_location: '',
      travel_itinerary: '',
      inclusions: '',
      seat_number: undefined,
      quantity: 1,
    };
    sessionStorage.setItem('prefilledClient', JSON.stringify(personalInfoOnly));
    setLocation("/clients/new");
  };

  const cancelClientMutation = useMutation({
    mutationFn: async ({ clientId, reason }: { clientId: string; reason: string }) => {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/clients/${clientId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to cancel client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cancelled-client-credits'] });
      toast({ title: 'Sucesso', description: 'Viagem cancelada e crédito gerado com sucesso' });
      setShowCancelDialog(false);
      setClientToCancel(null);
      setCancelReason("");
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível cancelar a viagem', variant: 'destructive' });
    },
  });

  const handleCancelClient = (client: Client) => {
    setClientToCancel(client);
    setShowCancelDialog(true);
  };

  const fixCompanionsMutation = useMutation({
    mutationFn: async () => {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/fix-missing-companions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fix companions');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({ 
        title: 'Sucesso', 
        description: `${data.companionsCreated} acompanhantes criados, ${data.reservationsUpdated} reservas atualizadas`
      });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível corrigir os acompanhantes', variant: 'destructive' });
    },
  });

  const confirmCancel = () => {
    if (clientToCancel && cancelReason.trim()) {
      cancelClientMutation.mutate({ clientId: clientToCancel.id, reason: cancelReason });
    }
  };

  const handleClientTypeSelection = (type: 'agencia' | 'operadora') => {
    setSelectedClientType(type);
    setShowClientTypeDialog(false);
    
    if (type === 'agencia') {
      sessionStorage.setItem('clientType', 'agencia');
      setLocation("/clients/new");
    } else {
      setShowOperatorDialog(true);
    }
  };

  const handleOperatorSelection = (operator: 'azul_viagens' | 'cvc' | 'rex_tour') => {
    sessionStorage.setItem('clientType', 'operadora');
    sessionStorage.setItem('operatorName', operator);
    setShowOperatorDialog(false);
    setLocation("/clients/new");
  };

  const totalClients = pagination.totalItems;
  const upcomingTrips = clients.filter(client => {
    if (!client.travel_date) return false;
    const travelDate = new Date(client.travel_date);
    const now = new Date();
    return travelDate > now;
  }).length;
  const uniqueDestinations = new Set(clients.map(c => c.destination)).size;

  // Calculate data quality statistics
  const completeClients = clients.filter(c => getClientDataQuality(c).status === 'complete').length;
  const incompleteClients = clients.filter(c => getClientDataQuality(c).status === 'incomplete').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Sticky Floating Action Buttons - Top Right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3">
        {/* Atalhos Button */}
        <button
          onClick={() => setShowShortcutsDialog(true)}
          data-testid="button-shortcuts-sticky"
          className="group relative flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-700 py-3 px-5 rounded-2xl transition-all duration-300 shadow-xl shadow-purple-500/10 border border-white/50 dark:border-slate-700/50 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-400/30 to-pink-500/20 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-gradient-to-br from-indigo-400/30 to-purple-500/20 rounded-full blur-lg opacity-40 group-hover:opacity-80 transition-opacity"></div>
          <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <span className="text-white text-sm">⚡</span>
          </div>
          <span className="relative font-bold text-slate-700 dark:text-white text-sm">Atalhos</span>
        </button>

        {/* Novo Cliente Button */}
        <button
          onClick={() => setShowClientTypeDialog(true)}
          data-testid="button-new-client-sticky"
          className="group relative flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-bold py-3 px-5 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full blur-lg"></div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
          <div className="relative flex items-center justify-center w-8 h-8 bg-white/20 rounded-xl">
            <Plus className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <span className="relative font-bold text-sm">Novo Cliente</span>
        </button>
      </div>

      {/* Floating Bubbles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient bubbles */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/30 via-indigo-300/20 to-purple-400/30 rounded-full blur-3xl animate-pulse" style={{animationDuration: '8s'}}></div>
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-gradient-to-br from-cyan-400/20 via-blue-300/15 to-sky-400/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-400/20 via-blue-300/15 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '12s', animationDelay: '4s'}}></div>
        
        {/* Smaller accent bubbles */}
        <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-gradient-to-br from-amber-400/40 to-orange-400/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-green-400/20 rounded-full blur-2xl"></div>
        <div className="absolute top-2/3 right-1/4 w-20 h-20 bg-gradient-to-br from-rose-400/30 to-pink-400/20 rounded-full blur-xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl relative z-10 pb-32">
        
        {/* Modern Glass Header */}
        <header className="mb-10 animate-in fade-in duration-500">
          <div className="relative">
            {/* Glass card with bubble effect */}
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-blue-500/10 border border-white/50 dark:border-slate-700/50 overflow-hidden">
              {/* Inner bubbles */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-lg opacity-50"></div>
                      <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-4 py-1.5 rounded-full">
                      Gestão de Clientes
                    </span>
                  </div>
                  <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent tracking-tight mb-3">
                    Seus Clientes
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg font-medium max-w-md">
                    Organize e acompanhe todos os seus clientes em um só lugar
                  </p>
                </div>
                
                {/* Stats Counter - Bubble Style */}
                <div className="flex items-center gap-4">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 dark:border-slate-700/50 text-center min-w-[120px] overflow-hidden">
                      <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-xl"></div>
                      <div className="relative">
                        <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-none">
                          {totalClients}
                        </div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                          Clientes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section - Modern Glass Bubble Cards */}
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {/* Upcoming Trips Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl shadow-emerald-500/5 border border-white/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-full blur-xl"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Próximas</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">{upcomingTrips}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">viagens</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl blur-lg opacity-40"></div>
                    <div className="relative h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Destinations Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl shadow-amber-500/5 border border-white/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-xl"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Destinos</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white">{uniqueDestinations}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">ativos</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-lg opacity-40"></div>
                    <div className="relative h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Data Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-teal-500/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl shadow-green-500/5 border border-white/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-green-400/20 to-teal-500/10 rounded-full blur-xl"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-2">Completo</p>
                    <h3 className="text-4xl font-black text-green-600 dark:text-green-400">{completeClients}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">com dados</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl blur-lg opacity-40"></div>
                    <div className="relative h-12 w-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Incomplete/Missing Data Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400/30 to-red-500/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl shadow-rose-500/5 border border-white/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-rose-400/20 to-red-500/10 rounded-full blur-xl"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-2">Faltando</p>
                    <h3 className="text-4xl font-black text-rose-600 dark:text-rose-400">{incompleteClients}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">incompletos</p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-red-500 rounded-xl blur-lg opacity-40"></div>
                    <div className="relative h-12 w-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Section - Glass Card */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-500/5 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative h-10 w-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                    <SearchIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buscar e Filtrar</h2>
              </div>
              <ClientFilters filters={filters} onFiltersChange={handleFiltersChange} />
            </div>
          </div>
        </section>

        {/* Client List Section */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <ClientList
            clients={clients}
            pagination={pagination}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
            onNewTrip={handleNewTrip}
            onCancel={handleCancelClient}
          />
        </section>
      </div>

      {/* Client Type Dialog - Modern Bubble Style */}
      <Dialog open={showClientTypeDialog} onOpenChange={setShowClientTypeDialog}>
        <DialogContent className="max-w-xl p-0 border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Adicionar Cliente</DialogTitle>
            <DialogDescription>Escolha o tipo de cliente</DialogDescription>
          </DialogHeader>
          
          {/* Background bubbles */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/15 to-pink-500/10 rounded-full blur-xl pointer-events-none"></div>
          
          {/* Header */}
          <div className="relative p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Adicionar Cliente</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Escolha o tipo de cliente</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative px-8 pb-8 space-y-4">
            {/* Agência Option */}
            <button
              onClick={() => handleClientTypeSelection('agencia')}
              className="group relative w-full flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-blue-100/80 via-blue-50/60 to-sky-100/80 dark:from-blue-900/40 dark:via-blue-950/30 dark:to-sky-900/40 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden text-left"
              data-testid="button-client-type-agencia"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-400/30 to-sky-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-lg">Destinos da Agência</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Clientes diretos da agência</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <span className="text-xl group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>

            {/* Operadora Option */}
            <button
              onClick={() => handleClientTypeSelection('operadora')}
              className="group relative w-full flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-emerald-100/80 via-green-50/60 to-teal-100/80 dark:from-emerald-900/40 dark:via-green-950/30 dark:to-teal-900/40 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden text-left"
              data-testid="button-client-type-operadora"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Plane className="h-7 w-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-lg">Operadoras</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Clientes de operadoras</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <span className="text-xl group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitation Link Dialog */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="max-w-2xl border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-blue-600" />
              Link de Cadastro
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">BETA</span>
            </DialogTitle>
            <DialogDescription>
              Gere um link para que seus clientes possam preencher seus próprios dados
            </DialogDescription>
          </DialogHeader>
          
          {!invitationLink ? (
            <div className="space-y-1 mt-1">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                    Tipo de Cliente
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedInvType('agencia')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedInvType === 'agencia'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <Building2 className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Agência</p>
                    </button>
                    <button
                      onClick={() => setSelectedInvType('operadora')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedInvType === 'operadora'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <Plane className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Operadora</p>
                    </button>
                  </div>
                </div>

                {selectedInvType === 'operadora' && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                      Operadora
                    </label>
                    <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a operadora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azul_viagens">Azul Viagens</SelectItem>
                        <SelectItem value="cvc">CVC</SelectItem>
                        <SelectItem value="rex_tour">Rex Tour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                    Destino (Opcional)
                  </label>
                  <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem destino específico</SelectItem>
                      {destinations?.map((dest) => (
                        <SelectItem key={dest.id} value={dest.name}>
                          {dest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={createInvitationLink}
                disabled={!selectedInvType || (selectedInvType === 'operadora' && !selectedOperator)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                <LinkIcon className="h-5 w-5 mr-2" />
                Gerar Link de Cadastro
              </Button>
            </div>
          ) : (
            <div className="space-y-1 mt-1">
              <div className="bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-900 dark:text-green-100">Link gerado com sucesso!</p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Compartilhe este link com seu cliente para que ele possa preencher os dados dele.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Link de Cadastro
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={invitationLink}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 font-mono text-sm"
                  />
                  <Button
                    onClick={copyInvitationLink}
                    variant="outline"
                    size="lg"
                    className="border-2"
                  >
                    {linkCopied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setInvitationLink("");
                    setSelectedInvType(null);
                    setSelectedOperator("");
                    setSelectedDestination("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Gerar Novo Link
                </Button>
                <Button
                  onClick={() => setShowInvitationDialog(false)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Operator Selection Dialog */}
      <Dialog open={showOperatorDialog} onOpenChange={setShowOperatorDialog}>
        <DialogContent className="max-w-md border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Selecione a Operadora</DialogTitle>
            <DialogDescription>
              Escolha qual operadora está relacionada a este cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 mt-2 py-4">
            {[
              { id: 'azul_viagens', name: 'Azul Viagens', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
              { id: 'cvc', name: 'CVC', gradient: 'from-green-500 to-green-600', bg: 'bg-green-100 dark:bg-green-950' },
              { id: 'rex_tour', name: 'Rex Tour', gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' }
            ].map((operator) => (
              <button
                key={operator.id}
                onClick={() => handleOperatorSelection(operator.id as 'azul_viagens' | 'cvc' | 'rex_tour')}
                className="group relative overflow-hidden rounded-xl p-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200/50 dark:border-slate-700/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 flex items-center gap-4 text-left hover:shadow-lg"
                data-testid={`button-operator-${operator.id.split('_')[0]}`}
              >
                <div className={`h-14 w-14 bg-gradient-to-br ${operator.gradient} rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                  <span className="font-bold text-white text-sm">{operator.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">{operator.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Operadora de turismo</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shortcuts Dialog - Modern Bubble Style */}
      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className="max-w-md p-0 border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Atalhos Rápidos</DialogTitle>
            <DialogDescription>Acesso rápido aos links</DialogDescription>
          </DialogHeader>
          
          {/* Background bubbles */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-purple-400/20 to-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/15 to-orange-500/10 rounded-full blur-xl pointer-events-none"></div>
          
          {/* Header */}
          <div className="relative p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Atalhos Rápidos</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Acesso rápido aos links</p>
              </div>
            </div>
          </div>

            {/* Content */}
            <div className="relative px-6 pb-6 space-y-4">
              {/* Operadoras Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <span className="text-xs">🌍</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Operadoras</span>
                </div>
                
                <div className="space-y-2">
                  {/* Azul Viagens */}
                  <a
                    href="https://www.azulviagens.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-100/80 via-blue-50/60 to-sky-100/80 dark:from-blue-900/40 dark:via-blue-950/30 dark:to-sky-900/40 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-400/30 to-sky-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">Azul Viagens</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Site oficial</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </a>

                  {/* CVC */}
                  <a
                    href="https://cvcagentes.cvc.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-100/80 via-green-50/60 to-teal-100/80 dark:from-emerald-900/40 dark:via-green-950/30 dark:to-teal-900/40 border border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">CVC</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Portal de agentes</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </a>

                  {/* Rex Tour */}
                  <a
                    href="https://www.rexturadvance.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-100/80 via-yellow-50/60 to-orange-100/80 dark:from-amber-900/40 dark:via-yellow-950/30 dark:to-orange-900/40 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-amber-400/30 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">Rex Tour</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Portal de vendas</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Outros Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                    <span className="text-xs">📌</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Outros</span>
                </div>
                
                <div className="space-y-2">
                  {/* Link de Cadastro */}
                  <button
                    onClick={() => {
                      setShowShortcutsDialog(false);
                      setShowInvitationDialog(true);
                    }}
                    className="group relative w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-100/80 via-violet-50/60 to-fuchsia-100/80 dark:from-purple-900/40 dark:via-violet-950/30 dark:to-fuchsia-900/40 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden text-left"
                  >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400/30 to-fuchsia-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">Link de Cadastro</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Gerar links para clientes</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </button>

                  {/* Canva */}
                  <a
                    href="https://www.canva.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-100/80 via-blue-50/60 to-violet-100/80 dark:from-indigo-900/40 dark:via-blue-950/30 dark:to-violet-900/40 border border-indigo-200/50 dark:border-indigo-800/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-indigo-400/30 to-violet-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">Canva</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Ferramentas de design</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Coming Soon Preview Dialog */}
      <Dialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
        <DialogContent className="max-w-2xl border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              Link de Cadastro - Em Breve!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Conheça os recursos incríveis que estarão disponíveis
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-2">
            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-start gap-3">
                  <Share2 className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Links Personalizados</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Gere links exclusivos e únicos para compartilhar com seus prospects</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-2 border-green-200/50 dark:border-green-800/50">
                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Sem Autenticação</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Seus prospects preenchem o formulário sem precisar de login</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-2 border-purple-200/50 dark:border-purple-800/50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Uso Único</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Cada link pode ser usado apenas uma vez para segurança</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-2 border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Prospects Automáticos</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Leads automaticamente registrados na página de orçamentos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">💡 Como funcionará:</span> Você gerará um link exclusivo, compartilha com seus prospects via email ou WhatsApp. Eles preenchem seus dados em uma página simples, sem precisar se autenticar. O cadastro deles aparece automaticamente em "Orçamento de Viagens" para você acompanhar.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setShowComingSoonDialog(false)}
              >
                Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Client Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              Cancelar Viagem
            </DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Um crédito será gerado automaticamente válido por 90 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <p className="text-sm font-medium">{clientToCancel?.first_name} {clientToCancel?.last_name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo do Cancelamento *</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Descreva o motivo do cancelamento..."
                rows={3}
                data-testid="textarea-cancel-reason"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button 
              onClick={confirmCancel}
              disabled={!cancelReason.trim() || cancelClientMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-confirm-cancel"
            >
              {cancelClientMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
