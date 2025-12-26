import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, Mail, Wifi, Palette, Phone, Globe, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SENHA_PASSWORD = "300400";

export function CredentialsModal({ isOpen, onClose }: CredentialsModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SENHA_PASSWORD) {
      setIsVerified(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
      toast({
        description: "Senha incorreta!",
        duration: 2000,
      });
    }
  };

  const handleModalClose = () => {
    setIsVerified(false);
    setPasswordInput("");
    setPasswordError(false);
    onClose();
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      description: `${label} copiado!`,
      duration: 2000,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const credentials = [
    {
      title: "Gmail - Rodabem",
      icon: Mail,
      gradient: "from-red-500/20 via-red-400/10 to-orange-300/5",
      borderColor: "border-red-300/30 dark:border-red-600/30",
      items: [
        { label: "Email", value: "rodabemesmeraldas@gmail.com" },
        { label: "Senha", value: "35387223" },
      ],
    },
    {
      title: "WiFi",
      icon: Wifi,
      gradient: "from-blue-500/20 via-blue-400/10 to-cyan-300/5",
      borderColor: "border-blue-300/30 dark:border-blue-600/30",
      items: [
        { label: "Rede", value: "Virtual Esmeraldas" },
        { label: "Senha", value: "esmeraldas" },
      ],
    },
    {
      title: "Canva",
      icon: Palette,
      gradient: "from-purple-500/20 via-purple-400/10 to-pink-300/5",
      borderColor: "border-purple-300/30 dark:border-purple-600/30",
      items: [
        { label: "Email", value: "dapr92@yahoo.com.br" },
        { label: "Senha", value: "Rodabem1$" },
      ],
    },
  ];

  const contacts = [
    { name: "Daniel", phone: "31999325341" },
    { name: "Rosinha", phone: "31996265523" },
    { name: "Alda", phone: "31995145026" },
    { name: "Iyed", phone: "31973221932" },
  ];

  if (!isVerified) {
    return (
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-md bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-2 border-white/30 dark:border-slate-700/50 shadow-2xl p-0 rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

          <DialogHeader className="bg-gradient-to-r from-[#6CC24A]/15 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-slate-900/50 dark:to-slate-950/50 px-8 py-6 border-b border-white/30 dark:border-slate-800/30 backdrop-blur-sm">
            <DialogTitle className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-[#6CC24A]/20 to-emerald-600/20 rounded-full border-2 border-[#6CC24A]/50">
                <Lock className="h-8 w-8 text-[#6CC24A]" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-[#6CC24A] to-emerald-600 bg-clip-text text-transparent">
                Acesso Protegido
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="px-8 py-6">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-6">
              Esta seção contém informações sensíveis. Por favor, digite a senha para continuar.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Digite a senha"
                  className={`w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 border-2 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6CC24A]/50 ${
                    passwordError
                      ? "border-red-500/50 bg-red-50/30 dark:bg-red-950/20"
                      : "border-white/30 dark:border-white/20 hover:border-white/50 dark:hover:border-white/30"
                  }`}
                  autoFocus
                  data-testid="input-senha-password"
                />
                {passwordError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    Senha incorreta. Tente novamente.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#6CC24A] to-emerald-600 text-white font-semibold rounded-xl py-2.5 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
                data-testid="button-submit-senha"
              >
                Verificar Senha
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-2 border-white/30 dark:border-slate-700/50 shadow-2xl p-0 flex flex-col rounded-[2rem] overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

        <DialogHeader className="bg-gradient-to-r from-[#6CC24A]/15 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-slate-900/50 dark:to-slate-950/50 px-8 py-5 border-b border-white/30 dark:border-slate-800/30 backdrop-blur-sm flex-shrink-0">
          <DialogTitle className="text-3xl font-black bg-gradient-to-r from-[#6CC24A] to-emerald-600 bg-clip-text text-transparent text-center">
            Senhas & Contatos
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Credentials */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-2 bg-gradient-to-b from-[#6CC24A] to-emerald-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Credenciais de Acesso
              </h3>
            </div>
            <div className="space-y-4">
              {credentials.map((cred) => {
                const Icon = cred.icon;
                return (
                  <div
                    key={cred.title}
                    className={`group relative rounded-[1.5rem] border-2 ${cred.borderColor} bg-gradient-to-br ${cred.gradient} backdrop-blur-2xl p-5 shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-500`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-white to-transparent pointer-events-none rounded-[1.5rem]"></div>

                    <div className="relative flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white/50 dark:bg-white/15 backdrop-blur-md rounded-full border border-white/60 dark:border-white/20 group-hover:bg-white/60 dark:group-hover:bg-white/25 transition-all duration-300 shadow-lg flex-shrink-0">
                        <Icon className="h-5 w-5 text-[#6CC24A]" />
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                        {cred.title}
                      </h4>
                    </div>

                    <div className="relative space-y-3">
                      {cred.items.map((item) => (
                        <div
                          key={item.label}
                          className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/50 dark:border-white/20 hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-300 shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                              {item.label}
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  item.value,
                                  `${cred.title} - ${item.label}`
                                )
                              }
                              className="p-2.5 rounded-full hover:bg-white/60 dark:hover:bg-white/15 transition-all duration-300 hover:scale-110"
                              data-testid={`copy-${cred.title}-${item.label}`}
                            >
                              {copied === `${cred.title} - ${item.label}` ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <Copy className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                              )}
                            </button>
                          </div>
                          <p className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 break-all tracking-tight">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Official Email */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-2 bg-gradient-to-b from-[#6CC24A] to-emerald-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Contato Oficial
              </h3>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-yellow-300/5 rounded-[1.5rem] border-2 border-amber-300/30 dark:border-amber-600/30 backdrop-blur-2xl p-5 shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-white to-transparent pointer-events-none rounded-[1.5rem]"></div>

              <div className="relative flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/50 dark:bg-white/15 backdrop-blur-md rounded-full border border-white/60 dark:border-white/20 group-hover:bg-white/60 dark:group-hover:bg-white/25 transition-all duration-300 shadow-lg flex-shrink-0">
                  <Globe className="h-5 w-5 text-[#6CC24A]" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                  Email da Agência
                </h4>
              </div>

              <div className="relative bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/50 dark:border-white/20 hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-300 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                    Contato
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        "contato@rodabemturismo.com",
                        "Email Oficial"
                      )
                    }
                    className="p-2.5 rounded-full hover:bg-white/60 dark:hover:bg-white/15 transition-all duration-300 hover:scale-110"
                    data-testid="copy-email-oficial"
                  >
                    {copied === "Email Oficial" ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    )}
                  </button>
                </div>
                <p className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 break-all tracking-tight">
                  contato@rodabemturismo.com
                </p>
              </div>
            </div>
          </section>

          {/* Contacts */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-2 bg-gradient-to-b from-[#6CC24A] to-emerald-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Telefones Corporativos
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.phone}
                  className="group relative rounded-[1.5rem] border-2 border-slate-300/30 dark:border-slate-600/30 bg-gradient-to-br from-slate-100/40 via-slate-50/20 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-transparent backdrop-blur-2xl p-5 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 from-white to-transparent pointer-events-none rounded-[1.5rem]"></div>

                  <div className="relative flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/50 dark:bg-white/15 backdrop-blur-md rounded-full border border-white/60 dark:border-white/20 group-hover:bg-white/60 dark:group-hover:bg-white/25 transition-all duration-300 shadow-lg flex-shrink-0">
                      <Phone className="h-5 w-5 text-[#6CC24A]" />
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                      {contact.name}
                    </p>
                  </div>

                  <div className="relative bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/50 dark:border-white/20 hover:bg-white/90 dark:hover:bg-white/20 transition-all duration-300 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                        Telefone
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(contact.phone, contact.name)
                        }
                        className="p-2.5 rounded-full hover:bg-white/60 dark:hover:bg-white/15 transition-all duration-300 hover:scale-110"
                        data-testid={`copy-phone-${contact.name}`}
                      >
                        {copied === contact.name ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        )}
                      </button>
                    </div>
                    <p className="font-sans text-base font-bold text-slate-900 dark:text-slate-100 break-all tracking-tight">
                      {contact.phone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
