import { useState, useEffect } from "react";
import { Search, User, Calendar, MapPin, DollarSign, History, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ref, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useLocation } from "wouter";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  cpf: string;
  birthdate: string;
  phone: string;
  email?: string;
  address?: string;
  destination: string;
  travel_date?: string;
  travel_price?: number;
  created_at: string;
}

interface ClientHistoryData {
  client: {
    first_name: string;
    last_name: string;
    cpf: string;
    birthdate: string;
    phone: string;
    email?: string;
    address?: string;
  };
  trips: Array<{
    id: string;
    destination: string;
    travel_date?: string;
    travel_price: number;
    created_at: string;
  }>;
  totalTrips: number;
  totalPaid: number;
  preferredDestinations: Array<{
    destination: string;
    count: number;
  }>;
  mostRecentTrip?: {
    destination: string;
    companyName?: string;
    children?: any[];
  };
}

export default function ClientHistory() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [allClients, setAllClients] = useState<ClientHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredClients, setFilteredClients] = useState<ClientHistoryData[]>([]);

  useEffect(() => {
    fetchAllClientsFromFirebase();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = allClients.filter(clientData => {
        const fullName = `${clientData.client.first_name} ${clientData.client.last_name}`.toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        return fullName.includes(searchLower) || 
               clientData.client.phone?.includes(searchLower) ||
               clientData.client.cpf?.includes(searchLower);
      });
      setFilteredClients(filtered);
    } else {
      setFilteredClients(allClients);
    }
  }, [searchQuery, allClients]);

  const fetchAllClientsFromFirebase = async () => {
    try {
      setIsLoading(true);
      const clientsRef = ref(rtdb, 'clients');
      const destinationsRef = ref(rtdb, 'destinations');
      const childrenRef = ref(rtdb, 'children');
      
      const [clientsSnapshot, destinationsSnapshot, childrenSnapshot] = await Promise.all([
        get(clientsRef),
        get(destinationsRef),
        get(childrenRef)
      ]);
      
      const destinationsData: { [key: string]: any } = destinationsSnapshot.exists() ? destinationsSnapshot.val() : {};
      const childrenData: { [key: string]: any } = childrenSnapshot.exists() ? childrenSnapshot.val() : {};
      
      if (clientsSnapshot.exists()) {
        const clientsData = clientsSnapshot.val();
        const clientsArray: Client[] = Object.keys(clientsData).map(id => ({
          id,
          ...clientsData[id]
        }));

        const clientsByCpf: { [cpf: string]: Client[] } = {};
        clientsArray.forEach(client => {
          if (!clientsByCpf[client.cpf]) {
            clientsByCpf[client.cpf] = [];
          }
          clientsByCpf[client.cpf].push(client);
        });

        const historyData: ClientHistoryData[] = Object.entries(clientsByCpf).map(([cpf, records]) => {
          const sortedRecords = records.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const mainClient = sortedRecords[0];

          const trips = records.map(client => ({
            id: client.id,
            destination: client.destination,
            travel_date: client.travel_date,
            travel_price: client.travel_price || 0,
            created_at: client.created_at
          }));

          const totalTrips = trips.length;
          const totalPaid = trips.reduce((sum, trip) => sum + trip.travel_price, 0);

          const destinationCounts: { [key: string]: number } = {};
          trips.forEach(trip => {
            destinationCounts[trip.destination] = (destinationCounts[trip.destination] || 0) + 1;
          });

          const preferredDestinations = Object.entries(destinationCounts)
            .map(([destination, count]) => ({ destination, count }))
            .sort((a, b) => b.count - a.count);

          // Get the most recent trip's children/companions
          let mostRecentTrip: { destination: string; companyName?: string; children?: any[] } | undefined;
          if (trips.length > 0) {
            const recentTripId = trips[0].id;
            const mainClientId = mainClient.id;
            const destData = Object.values(destinationsData).find((d: any) => d.name === trips[0].destination);
            
            // Get children for this client from the children collection (filter by main CLIENT id, not trip id)
            const childrenForClient = Object.entries(childrenData)
              .filter(([_, child]: [string, any]) => child.client_id === mainClientId)
              .map(([childId, child]: [string, any]) => ({
                id: childId,
                ...child
              }));
            
            console.log(`🔍 Recent trip ID: ${recentTripId}, Main Client ID: ${mainClientId}, found ${childrenForClient.length} children`);
            console.log('🔍 Children data:', childrenForClient);
            
            mostRecentTrip = {
              destination: trips[0].destination,
              companyName: destData?.nome_empresa_onibus,
              children: childrenForClient
            };
          }

          return {
            client: {
              first_name: mainClient.first_name,
              last_name: mainClient.last_name,
              cpf: mainClient.cpf,
              birthdate: mainClient.birthdate,
              phone: mainClient.phone,
              email: mainClient.email,
              address: mainClient.address
            },
            trips,
            totalTrips,
            totalPaid,
            preferredDestinations,
            mostRecentTrip
          };
        });

        historyData.sort((a, b) => b.totalTrips - a.totalTrips);
        
        setAllClients(historyData);
        setFilteredClients(historyData);
      }
    } catch (error) {
      console.error("Error fetching clients from Firebase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data não disponível";
    }
  };

  const handleNewTrip = (clientData: ClientHistoryData) => {
    // Parse birthdate if it's a string
    const birthdate = typeof clientData.client.birthdate === 'string' 
      ? new Date(clientData.client.birthdate) 
      : clientData.client.birthdate;

    // Get the most recent trip's details
    const mostRecentDestination = clientData.mostRecentTrip?.destination || '';
    const mostRecentChildren = (clientData.mostRecentTrip?.children || []).map((child: any) => {
      // Convert birthdate to string for JSON serialization
      const birthdateValue = child.birthdate 
        ? (child.birthdate instanceof Date ? child.birthdate.toISOString() : child.birthdate)
        : undefined;
        
      return {
        name: child.name,
        birthdate: birthdateValue,
        phone: child.phone || '',
        rg: child.rg || '',
        cpf: child.cpf || '',
        passport_number: child.passport_number || '',
        relationship: child.relationship,
        price: child.price,
      };
    });

    console.log('🎯 Nova Viagem clicked for:', clientData.client.first_name);
    console.log('🎯 Children being passed:', mostRecentChildren);

    const prefilledClient = {
      first_name: clientData.client.first_name,
      last_name: clientData.client.last_name,
      cpf: clientData.client.cpf,
      birthdate: birthdate instanceof Date ? birthdate.toISOString() : birthdate,
      phone: clientData.client.phone,
      email: clientData.client.email || '',
      address: clientData.client.address || '',
      destination: mostRecentDestination,
      client_type: 'agencia',
      duration: 1,
      children: mostRecentChildren, // Include companions/children from last trip
    };

    console.log('🎯 Full prefilledClient:', prefilledClient);
    sessionStorage.setItem('prefilledClient', JSON.stringify(prefilledClient));
    setLocation('/clients/new');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-14 w-14 rounded-xl bg-[#6CC24A] flex items-center justify-center shadow-md">
              <History className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Histórico de Clientes
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                {allClients.length} clientes registrados
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-6 border-gray-200 dark:border-gray-800 shadow-sm" data-testid="card-search">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-gray-300 dark:border-gray-700 focus:border-[#6CC24A] focus:ring-[#6CC24A]"
                data-testid="input-search-client"
              />
            </div>
            {searchQuery && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Mostrando <span className="font-semibold text-[#6CC24A]">{filteredClients.length}</span> resultado(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClients.length === 0 && (
          <Card className="shadow-sm border-gray-200 dark:border-gray-800">
            <CardContent className="p-12 text-center">
              <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        )}

        {/* Clients List */}
        <div className="space-y-6">
          {!isLoading && filteredClients.map((clientData, index) => (
            <Card 
              key={clientData.client.cpf} 
              className="border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-client-${index}`}
            >
              {/* Client Header */}
              <CardHeader className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-[#6CC24A]/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-[#6CC24A]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {clientData.client.first_name} {clientData.client.last_name}
                      </CardTitle>
                      <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                        {clientData.client.phone}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-[#6CC24A] text-white hover:bg-[#5ab03a] text-base px-4 py-2">
                    {clientData.totalTrips} {clientData.totalTrips === 1 ? "Viagem" : "Viagens"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-[#6CC24A]/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-[#6CC24A]" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Viagens</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid={`text-total-trips-${index}`}>
                      {clientData.totalTrips}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-[#6CC24A]/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-[#6CC24A]" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Investido</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid={`text-total-paid-${index}`}>
                      {formatCurrency(clientData.totalPaid)}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-[#6CC24A]/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-[#6CC24A]" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Destino Favorito</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid={`text-preferred-destination-${index}`}>
                      {clientData.preferredDestinations[0]?.destination || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Personal Info */}
                {(clientData.client.birthdate || clientData.client.email || clientData.client.address) && (
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 mb-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#6CC24A]" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clientData.client.birthdate && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Data de Nascimento</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white" data-testid={`text-birthday-${index}`}>
                            {formatDate(clientData.client.birthdate)}
                          </p>
                        </div>
                      )}
                      {clientData.client.email && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">{clientData.client.email}</p>
                        </div>
                      )}
                      {clientData.client.address && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Endereço</p>
                          <p className="text-base font-medium text-gray-900 dark:text-white">{clientData.client.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Destinations */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#6CC24A]" />
                    Destinos Visitados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {clientData.preferredDestinations.map((dest, destIndex) => (
                      <Badge
                        key={destIndex}
                        variant="outline"
                        className="text-sm px-3 py-1.5 border-[#6CC24A] text-[#6CC24A] hover:bg-[#6CC24A]/10"
                        data-testid={`destination-badge-${index}-${destIndex}`}
                      >
                        {dest.destination}
                        <span className="ml-2 bg-[#6CC24A] text-white rounded-full px-2 py-0.5 text-xs">
                          {dest.count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Trip History */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#6CC24A]" />
                      Histórico de Viagens ({clientData.trips.length})
                    </h3>
                    <Button
                      onClick={() => handleNewTrip(clientData)}
                      className="bg-[#6CC24A] hover:bg-[#5ab03a] text-white flex items-center gap-2"
                      size="sm"
                      data-testid={`button-new-trip-${index}`}
                    >
                      <Plane className="h-4 w-4" />
                      Nova Viagem
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {clientData.trips.slice(0, 5).map((trip, tripIndex) => (
                      <div
                        key={trip.id}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-[#6CC24A]/50 transition-colors"
                        data-testid={`trip-${index}-${tripIndex}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{trip.destination}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {trip.travel_date ? formatDate(trip.travel_date) : "Data não definida"}
                            </p>
                          </div>
                          <div className="text-lg font-bold text-[#6CC24A]">
                            {formatCurrency(trip.travel_price)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {clientData.trips.length > 5 && (
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                        + {clientData.trips.length - 5} viagens anteriores
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
