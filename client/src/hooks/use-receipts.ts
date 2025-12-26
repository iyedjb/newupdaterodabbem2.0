import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Receipt, type InsertReceipt } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

export function useReceipts() {
  return useQuery({
    queryKey: ['/api/receipts'],
    queryFn: async (): Promise<Receipt[]> => {
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch (error) {
          console.warn("Failed to get Firebase token:", error);
        }
      }
      
      const response = await fetch('/api/receipts', {
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch receipts');
      const data = await response.json();
      return data.map((receipt: any) => ({
        ...receipt,
        created_at: new Date(receipt.created_at),
        updated_at: new Date(receipt.updated_at),
      }));
    },
  });
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: ['/api/receipts', id],
    queryFn: async (): Promise<Receipt> => {
      const headers: Record<string, string> = {};
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch (error) {
          console.warn("Failed to get Firebase token:", error);
        }
      }
      
      const response = await fetch(`/api/receipts/${id}`, {
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch receipt');
      const data = await response.json();
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
    },
    enabled: !!id,
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (receipt: InsertReceipt) => {
      const response = await apiRequest('POST', '/api/receipts', receipt);
      const data = await response.json();
      
      // Generate PDF automatically
      const { generateReceiptPDF } = await import('@/lib/pdf-generator');
      await generateReceiptPDF({
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({
        title: "Recibo criado com sucesso!",
        description: "O recibo foi gerado e salvo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar recibo",
        description: error.message || "Não foi possível criar o recibo.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertReceipt> }) => {
      return await apiRequest('PUT', `/api/receipts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({
        title: "Recibo atualizado!",
        description: "O recibo foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar recibo",
        description: error.message || "Não foi possível atualizar o recibo.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/receipts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      toast({
        title: "Recibo excluído!",
        description: "O recibo foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir recibo",
        description: error.message || "Não foi possível excluir o recibo.",
        variant: "destructive",
      });
    },
  });
}
