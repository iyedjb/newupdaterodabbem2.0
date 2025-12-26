import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReceiptSchema, type InsertReceipt } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useClients } from "@/hooks/use-clients";
import { useClientBalance } from "@/hooks/use-client-balance";
import { Check, ChevronsUpDown, UserPlus, TrendingDown, CreditCard, MapPin, Calendar, CheckCircle2, Receipt, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { generatePaymentHistoryPDF } from "@/lib/pdf-generator";

// Helper to translate payment methods to Portuguese
const getPaymentMethodLabel = (method: string | undefined): string => {
  const labels: Record<string, string> = {
    'avista': 'À Vista',
    'pix': 'PIX',
    'dinheiro': 'Dinheiro',
    'debito': 'Débito',
    'credito': 'Crédito',
    'crediario_agencia': 'Crediário da Agência',
    'credito_banco': 'Crédito do Banco',
    'boleto': 'Boleto',
    'link': 'Link',
    'credito_viagens_anteriores': 'Crédito de Viagens Anteriores',
    'credito_viagens_interiores': 'Crédito de Viagens Interiores',
  };
  return labels[method || ''] || method || 'Não informado';
};

const receiptFormSchema = insertReceiptSchema.extend({
  amount: z.number().positive("O valor deve ser maior que zero"),
});

interface ReceiptFormProps {
  onSubmit: (data: InsertReceipt) => void;
  defaultValues?: Partial<InsertReceipt>;
  isLoading?: boolean;
}

interface SelectedClientInfo {
  id: string;
  name: string;
  destination?: string;
  travel_date?: string;
  travel_price?: number;
  down_payment?: number;
}

export function ReceiptForm({ onSubmit, defaultValues, isLoading }: ReceiptFormProps) {
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(defaultValues?.client_id);
  const [selectedClientInfo, setSelectedClientInfo] = useState<SelectedClientInfo | null>(null);
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | undefined>(undefined);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);

  const { clients, isLoading: clientsLoading } = useClients({ 
    search: searchQuery,
    limit: 10 
  });

  const { data: clientBalance, isLoading: balanceLoading } = useClientBalance(selectedClientId);

  const form = useForm<InsertReceipt>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      amount: defaultValues?.amount || 0,
      amount_in_words: defaultValues?.amount_in_words || "",
      reference: defaultValues?.reference || "",
      payment_method: defaultValues?.payment_method || undefined,
      seat_number: defaultValues?.seat_number || undefined,
      paid_to: defaultValues?.paid_to || undefined,
      payment_date: defaultValues?.payment_date || new Date(),
      client_id: defaultValues?.client_id || undefined,
      parcela_id: defaultValues?.parcela_id || undefined,
    },
  });

  const handlePayParcela = (parcela: any, parcelaNumber: number) => {
    // Round to 2 decimal places to prevent floating point issues
    const roundedAmount = Number(parseFloat(parcela.amount).toFixed(2));
    setSelectedParcelaId(parcela.id);
    form.setValue("parcela_id", parcela.id);
    form.setValue("amount", roundedAmount);
    form.setValue("amount_in_words", convertNumberToWords(roundedAmount));
    form.setValue("paid_to", `Parcela ${parcelaNumber}`);
    form.setValue("reference", `Pagamento da Parcela ${parcelaNumber} - ${formatCurrency(roundedAmount)}`);
  };

  const handlePayCalculatedParcela = (amount: number, parcelaNumber: number) => {
    // Round to 2 decimal places to prevent floating point issues
    const roundedAmount = Number(parseFloat(amount.toString()).toFixed(2));
    const virtualId = `calc-${parcelaNumber}`;
    setSelectedParcelaId(virtualId);
    form.setValue("parcela_id", undefined);
    form.setValue("amount", roundedAmount);
    form.setValue("amount_in_words", convertNumberToWords(roundedAmount));
    form.setValue("paid_to", `Parcela ${parcelaNumber}`);
    form.setValue("reference", `Pagamento da Parcela ${parcelaNumber} - ${formatCurrency(roundedAmount)}`);
  };

  const handleClearParcela = () => {
    setSelectedParcelaId(undefined);
    form.setValue("parcela_id", undefined);
    form.setValue("paid_to", "");
  };

  const handleGenerateEntradaReceipt = () => {
    if (!clientBalance || clientBalance.downPaymentAmount <= 0) return;
    
    const destination = selectedClientInfo?.destination || (clientBalance.client as any)?.destination || "";
    const entradaAmount = clientBalance.downPaymentAmount;
    
    form.setValue("amount", entradaAmount);
    form.setValue("amount_in_words", convertNumberToWords(entradaAmount));
    form.setValue("reference", `Entrada referente à viagem para ${destination}`);
    form.setValue("paid_to", "Entrada");
    setSelectedParcelaId(undefined);
    form.setValue("parcela_id", undefined);
    setIsGeneratingReceipt(true);
  };

  const handleRegenerateFullReceipt = () => {
    if (!clientBalance) return;
    
    const destination = selectedClientInfo?.destination || (clientBalance.client as any)?.destination || "";
    const totalAmount = clientBalance.totalTravelAmount;
    
    form.setValue("amount", totalAmount);
    form.setValue("amount_in_words", convertNumberToWords(totalAmount));
    form.setValue("reference", `Pagamento total referente à viagem para ${destination}`);
    form.setValue("paid_to", "Pagamento Total");
    setSelectedParcelaId(undefined);
    form.setValue("parcela_id", undefined);
    setIsGeneratingReceipt(true);
  };

  const currentName = form.watch("name");
  const currentAmount = form.watch("amount");

  // Handle client selection
  const handleSelectClient = (
    clientId: string, 
    clientName: string, 
    destination?: string, 
    travel_date?: string,
    travel_price?: number,
    down_payment?: number
  ) => {
    setSelectedClientId(clientId);
    setSelectedClientInfo({
      id: clientId,
      name: clientName,
      destination,
      travel_date,
      travel_price,
      down_payment
    });
    form.setValue("name", clientName);
    form.setValue("client_id", clientId);
    setIsManualEntry(false);
    setClientSearchOpen(false);
    setIsGeneratingReceipt(false);
  };

  // Handle manual name entry
  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedClientId(undefined);
    setSelectedClientInfo(null);
    form.setValue("client_id", undefined);
    form.setValue("name", searchQuery);
    setClientSearchOpen(false);
    setIsGeneratingReceipt(false);
  };

  // Wrap onSubmit to reset state after successful submission
  const handleFormSubmit = (data: InsertReceipt) => {
    setIsGeneratingReceipt(false);
    onSubmit(data);
  };

  // Auto-generate amount in words when amount changes
  const handleAmountChange = (value: string) => {
    // Replace comma with dot for parsing
    const normalizedValue = value.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (!isNaN(numValue) && numValue > 0) {
      // Ensure we only have 2 decimal places for the word conversion
      const roundedValue = Math.round(numValue * 100) / 100;
      const words = convertNumberToWords(roundedValue);
      form.setValue('amount_in_words', words);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Nome Completo</FormLabel>
              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientSearchOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                      data-testid="button-select-client"
                    >
                      {field.value || "Selecione ou digite um nome..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Digite para buscar cliente..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      data-testid="input-client-search"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {clientsLoading ? (
                          <span>Buscando clientes...</span>
                        ) : (
                          <div className="py-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                              Nenhum cliente encontrado
                            </p>
                          </div>
                        )}
                      </CommandEmpty>
                      {clients.length > 0 && (
                        <CommandGroup heading="Clientes encontrados (selecione a viagem)">
                          {clients.map((client) => {
                            const fullName = `${client.first_name} ${client.last_name}`;
                            const travelDateStr = client.travel_date ? String(client.travel_date) : undefined;
                            let formattedTravelDate: string | null = null;
                            try {
                              if (travelDateStr) {
                                const date = new Date(travelDateStr);
                                if (!isNaN(date.getTime())) {
                                  formattedTravelDate = format(date, 'dd/MM/yyyy');
                                }
                              }
                            } catch (e) {
                              formattedTravelDate = null;
                            }
                            return (
                              <CommandItem
                                key={client.id}
                                value={client.id}
                                onSelect={() => handleSelectClient(
                                  client.id, 
                                  fullName, 
                                  client.destination, 
                                  travelDateStr,
                                  client.travel_price,
                                  client.down_payment
                                )}
                                className="cursor-pointer"
                                data-testid={`client-option-${client.id}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 flex-shrink-0",
                                    selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium">{fullName}</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {client.destination && (
                                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {client.destination}
                                      </span>
                                    )}
                                    {formattedTravelDate && (
                                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formattedTravelDate}
                                      </span>
                                    )}
                                  </div>
                                  {client.phone && (
                                    <span className="text-xs text-muted-foreground mt-0.5">
                                      {client.phone}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                      {searchQuery.trim().length > 0 && (
                        <CommandGroup heading="Adicionar novo">
                          <CommandItem
                            onSelect={handleManualEntry}
                            className="cursor-pointer"
                            data-testid="button-manual-name"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Usar nome: "{searchQuery}"</span>
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isManualEntry && (
                <p className="text-xs text-muted-foreground">
                  Nome manual (cliente novo)
                </p>
              )}
              {selectedClientInfo && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Cliente vinculado ao recibo
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedClientInfo.destination && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedClientInfo.destination}
                      </span>
                    )}
                    {selectedClientInfo.travel_date && (() => {
                      try {
                        const date = new Date(selectedClientInfo.travel_date);
                        if (!isNaN(date.getTime())) {
                          return (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(date, 'dd/MM/yyyy')}
                            </span>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
              {selectedClientId && balanceLoading && (
                <p className="text-xs text-muted-foreground">
                  Carregando dados de pagamento...
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fallback Summary when balance API fails but we have client data */}
        {selectedClientId && !isManualEntry && !balanceLoading && !clientBalance && selectedClientInfo && (
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <TrendingDown className="h-4 w-4" />
                Resumo de Pagamento (Dados básicos)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {(selectedClientInfo.travel_price && selectedClientInfo.travel_price > 0) ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Total da Viagem:</span>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      {formatCurrency(selectedClientInfo.travel_price)}
                    </p>
                  </div>
                  {(selectedClientInfo.down_payment !== undefined && selectedClientInfo.down_payment > 0) && (
                    <div>
                      <span className="text-muted-foreground">Entrada:</span>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        {formatCurrency(selectedClientInfo.down_payment)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Este cliente não possui valor de viagem configurado. 
                  Você ainda pode criar o recibo, mas os dados de pagamento não estão disponíveis.
                </p>
              )}
            </CardContent>
          </Card>
        )}
        {clientBalance && !isManualEntry && (
          <Card className={cn(
            clientBalance.outstandingBalance <= 0
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {clientBalance.outstandingBalance <= 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 dark:text-green-400">Resumo de Pagamento</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-blue-600" />
                    Resumo de Pagamento
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Total da Viagem:</span>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {formatCurrency(clientBalance.totalTravelAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Já Pago:</span>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    {formatCurrency(clientBalance.totalPaid)}
                  </p>
                </div>
              </div>

              {/* Payment Method and Dates Info */}
              <div className="bg-white dark:bg-blue-900/20 p-2 rounded space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Forma de Pagamento:</p>
                    <p className="font-medium text-sm">
                      {getPaymentMethodLabel((clientBalance.client as any)?.payment_method)}
                      {(clientBalance.client as any)?.payment_method === 'avista' && (clientBalance.client as any)?.avista_payment_type && (
                        <span className="text-muted-foreground"> ({getPaymentMethodLabel((clientBalance.client as any)?.avista_payment_type)})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data do Contrato:</p>
                    <p className="font-medium text-sm">
                      {(clientBalance.client as any)?.created_at 
                        ? format(new Date((clientBalance.client as any).created_at), 'dd/MM/yyyy')
                        : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Down Payment Info */}
              {clientBalance.downPaymentAmount > 0 && (
                <div className="bg-white dark:bg-blue-900/20 p-2 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Entrada:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{formatCurrency(clientBalance.downPaymentAmount)}</p>
                        {clientBalance.entradaPaid && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Pago
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!clientBalance.entradaPaid && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 hover:border-purple-400 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                        onClick={handleGenerateEntradaReceipt}
                        data-testid="button-generate-entrada-receipt"
                      >
                        <Receipt className="h-3 w-3 mr-1" />
                        Gerar Recibo de Entrada
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Installments List */}
              {((clientBalance.parcelas?.length ?? 0) > 0 || clientBalance.remainingInstallments > 0) && (
                <div className="bg-white dark:bg-blue-900/20 p-2 rounded space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Parcelas Pendentes:</p>
                  {selectedParcelaId && (
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 p-1.5 rounded border border-green-200 dark:border-green-700">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pagando parcela
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-xs text-red-600 hover:text-red-700"
                        onClick={handleClearParcela}
                        data-testid="button-clear-parcela"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {clientBalance.parcelas && clientBalance.parcelas.length > 0 ? (
                      // Show actual parcelas from database
                      clientBalance.parcelas.map((parcela: any, idx: number) => (
                        <div 
                          key={parcela.id} 
                          className={cn(
                            "flex items-center justify-between text-xs p-1.5 rounded border",
                            parcela.status === 'paid' 
                              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                              : selectedParcelaId === parcela.id
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                          )}
                        >
                          <div className="flex flex-col">
                            <span className={parcela.status === 'paid' ? 'line-through text-green-600' : ''}>
                              Parcela {idx + 1}: {formatCurrency(parcela.amount)}
                            </span>
                            {parcela.due_date && (
                              <span className="text-[10px] text-muted-foreground">
                                Vence: {new Date(parcela.due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {parcela.status === 'paid' ? (
                              <span className="text-xs text-green-600 font-medium">✓ Pago</span>
                            ) : (
                              <>
                                <span className={`text-xs ${parcela.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                                  {parcela.status === 'overdue' ? 'Vencido' : 'Pendente'}
                                </span>
                                <Button
                                  type="button"
                                  variant={selectedParcelaId === parcela.id ? "default" : "outline"}
                                  size="sm"
                                  className={cn(
                                    "h-6 px-2 text-xs",
                                    selectedParcelaId === parcela.id 
                                      ? "bg-green-600 hover:bg-green-700 text-white" 
                                      : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                  )}
                                  onClick={() => handlePayParcela(parcela, idx + 1)}
                                  data-testid={`button-pay-parcela-${idx + 1}`}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {selectedParcelaId === parcela.id ? 'Selecionada' : 'Pagar'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      // Show calculated installments if they don't exist yet with Pagar buttons
                      Array.from({ length: clientBalance.remainingInstallments }).map((_, idx) => {
                        const virtualId = `calc-${idx + 1}`;
                        return (
                          <div 
                            key={virtualId} 
                            className={cn(
                              "flex items-center justify-between text-xs p-1.5 rounded border",
                              selectedParcelaId === virtualId
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                            )}
                          >
                            <div className="flex flex-col">
                              <span>
                                Parcela {idx + 1}: {formatCurrency(clientBalance.installmentAmount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-amber-600">Pendente</span>
                              <Button
                                type="button"
                                variant={selectedParcelaId === virtualId ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-6 px-2 text-xs",
                                  selectedParcelaId === virtualId 
                                    ? "bg-green-600 hover:bg-green-700 text-white" 
                                    : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                )}
                                onClick={() => handlePayCalculatedParcela(clientBalance.installmentAmount, idx + 1)}
                                data-testid={`button-pay-parcela-${idx + 1}`}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                {selectedParcelaId === virtualId ? 'Selecionada' : 'Pagar'}
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              
              <div className={cn(
                "space-y-1 p-2 rounded border",
                clientBalance.outstandingBalance <= 0
                  ? "bg-white dark:bg-green-900/20 border-green-200 dark:border-green-700"
                  : "bg-white dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
              )}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço Base (Cliente):</span>
                  <span>{formatCurrency((clientBalance.client as any).travel_price || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Companhia:</span>
                  <span>{formatCurrency((clientBalance.totalTravelAmount || 0) - ((clientBalance.client as any).travel_price || 0))}</span>
                </div>
                <div className={cn(
                  "flex justify-between text-sm font-semibold pt-1 mt-1 border-t",
                  clientBalance.outstandingBalance <= 0
                    ? "border-green-200 dark:border-green-700"
                    : "border-blue-200 dark:border-blue-700"
                )}>
                  <span>Total a Receber:</span>
                  <span className={cn(
                    "text-lg",
                    clientBalance.outstandingBalance <= 0
                      ? "text-green-700 dark:text-green-400"
                      : "text-blue-900 dark:text-blue-100"
                  )}>
                    {formatCurrency(clientBalance.outstandingBalance)}
                  </span>
                </div>
                {clientBalance.outstandingBalance <= 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 dark:text-green-400 font-bold text-base">
                        PAGO COMPLETO
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                      onClick={handleRegenerateFullReceipt}
                      data-testid="button-regenerate-receipt"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Regerar Recibo
                    </Button>
                  </div>
                )}
              </div>

              {/* Button to generate payment history PDF for client */}
              {clientBalance && !balanceLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 hover:border-purple-400 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700"
                  onClick={() => generatePaymentHistoryPDF(clientBalance)}
                  data-testid="button-generate-payment-history"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Histórico de Pagamento (PDF)
                </Button>
              )}

              {currentAmount > 0 && (
                <div className="pt-2 bg-white dark:bg-blue-900/20 p-2 rounded border border-blue-300 dark:border-blue-700">
                  <p className="text-xs text-muted-foreground">Após este pagamento:</p>
                  <p className="font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(Math.max(0, clientBalance.outstandingBalance - currentAmount))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hide form fields when client is fully paid (unless generating receipt) */}
        {(!clientBalance || clientBalance.outstandingBalance > 0 || isManualEntry || isGeneratingReceipt) && (
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="0,00"
                    value={field.value === 0 ? "" : field.value.toString().replace('.', ',')}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d,]/g, "");
                      // Ensure only one comma
                      const commaCount = (val.match(/,/g) || []).length;
                      if (commaCount > 1) {
                        const parts = val.split(",");
                        val = parts[0] + "," + parts.slice(1).join("");
                      }
                      
                      // Limit to 2 decimal places
                      if (val.includes(",")) {
                        const [int, dec] = val.split(",");
                        if (dec.length > 2) {
                          val = `${int},${dec.slice(0, 2)}`;
                        }
                      }
                      
                      const numericValue = parseFloat(val.replace(',', '.')) || 0;
                      field.onChange(numericValue);
                      handleAmountChange(val);
                    }}
                    data-testid="input-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(!clientBalance || clientBalance.outstandingBalance > 0 || isManualEntry || isGeneratingReceipt) && (
          <>
            <FormField
              control={form.control}
              name="amount_in_words"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor por Extenso</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Digite o valor por extenso"
                      rows={2}
                      data-testid="input-amount-words"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referente a</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva o motivo do pagamento"
                      rows={3}
                      data-testid="input-reference"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="credito_viagens_interiores">Crédito de Viagens Interiores</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Assento (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o número do assento"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      data-testid="input-seat-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paid_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcela a Frente de (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: 1ª parcela"
                      value={field.value || ""}
                      data-testid="input-paid-to"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Temporary section for adding old receipts */}
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Calendar className="h-4 w-4" />
                  📅 Adicionar Recibos Antigos (Temporário)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant={useCustomDate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCustomDate(!useCustomDate)}
                  className={cn(
                    "w-full",
                    useCustomDate && "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  {useCustomDate ? "✓ Usando data customizada" : "Clique para adicionar recibo antigo"}
                </Button>
                
                {useCustomDate && (
                  <FormField
                    control={form.control}
                    name="payment_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-700 dark:text-amber-400">Data do Recibo Antigo</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                field.onChange(new Date(e.target.value));
                              }
                            }}
                            data-testid="input-old-receipt-date"
                          />
                        </FormControl>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ⚠️ Seção temporária para importar recibos antigos. Desative após usar.
                        </p>
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-submit"
            >
              {isLoading 
                ? (defaultValues ? "Atualizando recibo..." : "Gerando recibo...") 
                : (defaultValues ? "Atualizar Recibo" : "Gerar Recibo")}
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Helper function to convert number to words in Portuguese
function convertNumberToWords(value: number): string {
  if (value === 0) return 'zero reais';
  
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  
  const reais = Math.floor(value);
  const centavos = Math.round((value - reais) * 100);
  
  function convertUpToThousand(num: number): string {
    if (num === 0) return '';
    if (num === 100) return 'cem';
    
    let result = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    
    if (h > 0) {
      result += hundreds[h];
      if (t > 0 || u > 0) result += ' e ';
    }
    
    if (t === 1) {
      result += teens[u];
    } else {
      if (t > 1) {
        result += tens[t];
        if (u > 0) result += ' e ';
      }
      if (u > 0 && t !== 1) {
        result += units[u];
      }
    }
    
    return result;
  }
  
  let result = '';
  
  if (reais >= 1000) {
    const thousands = Math.floor(reais / 1000);
    result += convertUpToThousand(thousands);
    if (thousands === 1) {
      result += ' mil';
    } else {
      result += ' mil';
    }
    
    const remainder = reais % 1000;
    if (remainder > 0) {
      result += ' e ' + convertUpToThousand(remainder);
    }
  } else {
    result += convertUpToThousand(reais);
  }
  
  result += reais === 1 ? ' real' : ' reais';
  
  if (centavos > 0) {
    result += ' e ' + convertUpToThousand(centavos);
    result += centavos === 1 ? ' centavo' : ' centavos';
  }
  
  return result;
}
