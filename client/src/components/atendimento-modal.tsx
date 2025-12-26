import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, History, Gift, MapPin, Bus, Calendar } from "lucide-react";
import { useLocation } from "wouter";

const menuItems = [
  { label: "Clientes", icon: Users, href: "/clients", color: "bg-blue-500" },
  { label: "Histórico de Clientes", icon: History, href: "/client-history", color: "bg-purple-500" },
  { label: "Indicações", icon: Gift, href: "/indicacoes", color: "bg-pink-500" },
  { label: "Orçamento de Viagens", icon: MapPin, href: "/parcelas", color: "bg-orange-500" },
  { label: "Destinos", icon: MapPin, href: "/destinations", color: "bg-green-500" },
  { label: "Programa de Viagens", icon: Calendar, href: "/programa-viagens", color: "bg-cyan-500" },
  { label: "Descrição de Ônibus", icon: Bus, href: "/buses", color: "bg-indigo-500" },
];

export function AtendimentoClienteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, setLocation] = useLocation();

  const handleNavigate = (href: string) => {
    setLocation(href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Atendimento do Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                data-testid={`button-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center gap-4 p-4 rounded-full border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:shadow-lg hover:scale-[1.02] group shadow-sm"
              >
                <div className={`${item.color} p-3 rounded-full text-white group-hover:scale-110 transition-transform shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Acessar</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
