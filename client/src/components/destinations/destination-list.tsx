import { Plus, Edit, Trash2, Archive, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseDateValue } from "@/lib/date-utils";
import { type Destination } from "@shared/schema";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBuses } from "@/hooks/use-buses";
import { useAllSeatReservations } from "@/hooks/use-seat-reservations";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DestinationListProps {
  onEdit: (destination: Destination) => void;
  onAdd: () => void;
  isVadmin: boolean;
}

export function DestinationList({ onEdit, onAdd, isVadmin }: DestinationListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const { data: destinations = [], isLoading } = useQuery<Destination[]>({
    queryKey: ['/api/destinations'],
  });

  const { data: buses } = useBuses();
  const { data: seatReservations } = useAllSeatReservations();

  const getAvailableSeats = (destination: Destination) => {
    if (!destination.bus_id || !buses || !seatReservations) return null;
    
    const bus = buses.find((b) => b.id === destination.bus_id);
    if (!bus) return null;
    
    const totalSeats = bus.total_seats;
    const reservedSeats = seatReservations.filter(
      (r) => r.destination_id === destination.id
    ).length;
    
    return totalSeats - reservedSeats;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/destinations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/destinations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/destinations/active'] });
      toast({
        title: "Destino excluído",
        description: "O destino foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o destino.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Separate active and archived destinations
  const { activeDestinations, archivedDestinations } = useMemo(() => {
    const now = new Date();
    const active: Destination[] = [];
    const archived: Destination[] = [];

    destinations.forEach((dest) => {
      const endDate = parseDateValue(dest.periodo_viagem_fim);
      
      if (endDate && endDate < now) {
        archived.push(dest);
      } else {
        active.push(dest);
      }
    });

    return { activeDestinations: active, archivedDestinations: archived };
  }, [destinations]);

  // Group active destinations by month
  const destinationsByMonth = useMemo(() => {
    const grouped: { [key: string]: { destinations: Destination[], sampleDate: Date } } = {};
    const undatedKey = 'no-date';
    
    activeDestinations.forEach((dest) => {
      const startDate = parseDateValue(dest.periodo_viagem_inicio);
      
      if (startDate) {
        const monthKey = format(startDate, 'yyyy-MM', { locale: ptBR });
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = { destinations: [], sampleDate: startDate };
        }
        grouped[monthKey].destinations.push(dest);
      } else {
        // No valid date - add to undated
        if (!grouped[undatedKey]) {
          grouped[undatedKey] = { destinations: [], sampleDate: new Date() };
        }
        grouped[undatedKey].destinations.push(dest);
      }
    });

    // Sort month keys, putting undated at the end
    return Object.entries(grouped).sort(([a], [b]) => {
      if (a === undatedKey) return 1;
      if (b === undatedKey) return -1;
      return a.localeCompare(b);
    });
  }, [activeDestinations]);

  // Filter archived destinations by year and month (using end date)
  const filteredArchivedDestinations = useMemo(() => {
    let filtered = archivedDestinations;

    if (selectedYear !== 'all') {
      filtered = filtered.filter((dest) => {
        const date = parseDateValue(dest.periodo_viagem_fim);
        return date && date.getFullYear().toString() === selectedYear;
      });
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter((dest) => {
        const date = parseDateValue(dest.periodo_viagem_fim);
        return date && (date.getMonth() + 1).toString() === selectedMonth;
      });
    }

    return filtered;
  }, [archivedDestinations, selectedYear, selectedMonth]);

  // Get available years from archived destinations (using end date)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    archivedDestinations.forEach((dest) => {
      const date = parseDateValue(dest.periodo_viagem_fim);
      if (date) {
        years.add(date.getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [archivedDestinations]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Lista de Destinos", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 30);

    const tableData = activeDestinations.map((dest) => {
      const startDate = parseDateValue(dest.periodo_viagem_inicio);
      const endDate = parseDateValue(dest.periodo_viagem_fim);
      const availableSeats = getAvailableSeats(dest);
      
      return [
        dest.name,
        dest.country || '-',
        startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : '-',
        endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : '-',
        dest.price ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(dest.price) : '-',
        availableSeats !== null ? `${availableSeats} vagas` : '-',
        dest.is_active ? 'Ativo' : 'Inativo'
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [['Nome', 'País', 'Início', 'Fim', 'Preço', 'Vagas', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 194, 74] },
    });

    doc.save(`destinos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: "PDF exportado",
      description: "A lista de destinos foi exportada com sucesso.",
    });
  };

  const renderDestinationRow = (destination: Destination) => (
    <TableRow key={destination.id} data-testid={`row-destination-${destination.id}`}>
      <TableCell className="font-medium" data-testid={`text-destination-name-${destination.id}`}>
        {destination.name}
      </TableCell>
      <TableCell data-testid={`text-destination-country-${destination.id}`}>
        {destination.country}
      </TableCell>
      <TableCell data-testid={`text-destination-dates-${destination.id}`}>
        {(() => {
          const startDate = parseDateValue(destination.periodo_viagem_inicio);
          const endDate = parseDateValue(destination.periodo_viagem_fim);
          
          if (startDate && endDate) {
            return (
              <div className="text-sm">
                <div>{format(startDate, 'dd/MM/yyyy', { locale: ptBR })}</div>
                <div className="text-muted-foreground">até</div>
                <div>{format(endDate, 'dd/MM/yyyy', { locale: ptBR })}</div>
              </div>
            );
          }
          return '-';
        })()}
      </TableCell>
      <TableCell data-testid={`text-destination-price-${destination.id}`}>
        {destination.price ? 
          new Intl.NumberFormat("pt-BR", { 
            style: "currency", 
            currency: "BRL" 
          }).format(destination.price) 
          : "-"
        }
      </TableCell>
      <TableCell data-testid={`text-destination-available-seats-${destination.id}`}>
        {(() => {
          const availableSeats = getAvailableSeats(destination);
          if (availableSeats === null) return "-";
          
          return (
            <Badge 
              variant={availableSeats > 10 ? "default" : availableSeats > 0 ? "secondary" : "destructive"}
            >
              {availableSeats > 0 
                ? `${availableSeats} ${availableSeats === 1 ? 'vaga' : 'vagas'}` 
                : "Esgotado"}
            </Badge>
          );
        })()}
      </TableCell>
      <TableCell data-testid={`text-destination-status-${destination.id}`}>
        <Badge variant={destination.is_active ? "default" : "secondary"}>
          {destination.is_active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(destination)}
            disabled={!isVadmin}
            data-testid={`button-edit-destination-${destination.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!isVadmin}
                data-testid={`button-delete-destination-${destination.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir destino</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o destino "{destination.name}"? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(destination.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando destinos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Destinos</h3>
          <p className="text-sm text-muted-foreground">
            Destinos ativos e arquivados por data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-destinations-pdf">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={onAdd} disabled={!isVadmin} data-testid="button-add-destination">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Destino
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" data-testid="tab-active-destinations">
            Destinos Ativos ({activeDestinations.length})
          </TabsTrigger>
          <TabsTrigger value="archived" data-testid="tab-archived-destinations">
            <Archive className="mr-2 h-4 w-4" />
            Arquivados ({archivedDestinations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {destinationsByMonth.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-1 text-muted-foreground">
                  Nenhum destino ativo cadastrado.
                </div>
              </CardContent>
            </Card>
          ) : (
            destinationsByMonth.map(([monthKey, { destinations: monthDestinations, sampleDate }]) => {
              let monthLabel: string;
              
              if (monthKey === 'no-date') {
                monthLabel = 'Sem data definida';
              } else {
                monthLabel = format(sampleDate, 'MMMM yyyy', { locale: ptBR });
              }
              
              return (
                <Card key={monthKey}>
                  <CardHeader>
                    <CardTitle className="text-xl capitalize">{monthLabel}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>País</TableHead>
                          <TableHead>Datas da Viagem</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Vagas Disponíveis</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthDestinations.map(renderDestinationRow)}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Destinos Arquivados
              </CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Filtrar por Ano</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger data-testid="select-year-filter">
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Filtrar por Mês</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger data-testid="select-month-filter">
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredArchivedDestinations.length === 0 ? (
                <div className="text-center py-1 text-muted-foreground">
                  Nenhum destino arquivado encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Datas da Viagem</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Vagas Disponíveis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArchivedDestinations.map(renderDestinationRow)}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}