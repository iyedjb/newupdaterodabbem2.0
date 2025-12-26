import { Search, MapPin, Filter, ArrowUpDown, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDestinations } from "@/hooks/use-destinations";
import type { FilterOptions } from "@/types";

interface ClientFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function ClientFilters({ filters, onFiltersChange }: ClientFiltersProps) {
  const { data: destinations, isLoading: destinationsLoading } = useDestinations();

  return (
    <Card className="shadow-md border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-600" />
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                data-testid="input-search"
                type="text"
                placeholder="Nome, destino..."
                className="pl-10 h-11 border-2 focus:border-blue-500 transition-colors"
                value={filters.search || ''}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Destino
            </Label>
            <Select
              value={filters.destination || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, destination: value === 'all' ? undefined : value })}
              disabled={destinationsLoading}
            >
              <SelectTrigger data-testid="select-destination" className="h-11 border-2 focus:border-green-500">
                <SelectValue placeholder="Todos os destinos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os destinos</SelectItem>
                {destinations?.map((dest) => (
                  <SelectItem key={dest.id} value={dest.name}>
                    {dest.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-purple-600" />
              Status
            </Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger data-testid="select-status" className="h-11 border-2 focus:border-purple-500">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client-type" className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Tipo de Cliente
            </Label>
            <Select
              value={filters.client_type || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, client_type: value === 'all' ? undefined : value as 'agencia' | 'operadora' })}
            >
              <SelectTrigger data-testid="select-client-type" className="h-11 border-2 focus:border-indigo-500">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="agencia">Destinos da Agência</SelectItem>
                <SelectItem value="operadora">Operadoras</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sortBy" className="text-sm font-semibold flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-amber-600" />
              Ordenar por
            </Label>
            <Select
              value={filters.sortBy || 'name'}
              onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as FilterOptions['sortBy'] })}
            >
              <SelectTrigger data-testid="select-sort" className="h-11 border-2 focus:border-amber-500">
                <SelectValue placeholder="Nome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="travel_date">Data da Viagem</SelectItem>
                <SelectItem value="created_at">Data de Cadastro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
