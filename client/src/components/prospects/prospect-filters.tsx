import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterOptions } from "@/types";

interface ProspectFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export function ProspectFilters({ filters, onFiltersChange }: ProspectFiltersProps) {
  return (
    <Card className="mb-1">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                data-testid="input-search-prospects"
                type="text"
                placeholder="Nome, destino ou email..."
                className="pl-10"
                value={filters.search || ''}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="destination">Destino</Label>
            <Select
              value={filters.destination || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, destination: value === 'all' ? undefined : value })}
            >
              <SelectTrigger data-testid="select-destination-prospects">
                <SelectValue placeholder="Todos os destinos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os destinos</SelectItem>
                <SelectItem value="paris">Paris</SelectItem>
                <SelectItem value="london">Londres</SelectItem>
                <SelectItem value="tokyo">Tóquio</SelectItem>
                <SelectItem value="nyc">Nova York</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status da Cotação</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger data-testid="select-status-prospects">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="viewed">Visualizada</SelectItem>
                <SelectItem value="accepted">Aceita</SelectItem>
                <SelectItem value="rejected">Rejeitada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={filters.sortBy || 'created_at'}
              onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as any })}
            >
              <SelectTrigger data-testid="select-sort-prospects">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="travel_date">Data da Viagem</SelectItem>
                <SelectItem value="created_at">Data de Criação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}