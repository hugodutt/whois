import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { getWhoisInfo, getIPInfo } from "./lib/domain-info";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Search, Shield, Server, Clock, AlertTriangle, Mail, MapPin, Building2, Globe, Terminal, Database, Network } from "lucide-react";
interface IPInfo {
  ip?: string;
  asn?: string;
  isp?: string;
  org?: string;
  country?: string;
  city?: string;
  abuse?: {
    email?: string;
  };
  abuse_contact?: {
    email?: string;
  };
  location?: {
    city?: string;
    country?: string;
  };
}

export default function App() {
  const [domain, setDomain] = useState("");
  const [whoisData, setWhoisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractAbuseEmailFromRawData = (rawdata: string[] | undefined): string => {
    if (!rawdata || !Array.isArray(rawdata)) return "Não disponível";
    
    for (const data of rawdata) {
      const match = data.match(/Registrar Abuse Contact Email:\s*([^\s\n]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return "Não disponível";
  };

  const handleSearch = async () => {
    if (!domain) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
      const whoisResult = await getWhoisInfo(cleanDomain);
      
      // Buscar IP do domínio
      let ipInfo: IPInfo | undefined = undefined;
      try {
        // Buscar IP do domínio
        const dnsRes = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`);
        const dnsInfo = await dnsRes.json();
        if (dnsInfo.Answer && dnsInfo.Answer.length > 0) {
          const ip = dnsInfo.Answer[0].data;
          ipInfo = await getIPInfo(ip);
          console.log('IP Info:', ipInfo); // Para debug
        }
      } catch (err) {
        console.error("Erro ao buscar IP:", err);
      }

      // Formatando as datas para o formato DD/MM/YYYY
      const formatDate = (dateStr: string) => {
        if (!dateStr) return "Não disponível";
        const date = new Date(dateStr);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      // Formatando apenas os dados que aparecem na interface
      // Apenas os dados que precisamos mostrar na interface
      // Usando a estrutura correta do WhoisResult
      const registrarData = {
        name: whoisResult.registrar?.name || "Não disponível",
        creationDate: whoisResult.created || "Não disponível",
        expirationDate: whoisResult.expires || "Não disponível",
        nameServers: whoisResult.nameserver || [],
        status: whoisResult.status || [],
        abuseContact: whoisResult.registrar?.email || extractAbuseEmailFromRawData(whoisResult.rawdata) || "Não disponível"
      };

      const hostingData = {
        provider: ipInfo?.asn?.org || ipInfo?.company?.name || "Não disponível",
        cidr: ipInfo?.asn?.route || ipInfo?.company?.network || "Não disponível",
        asn: typeof ipInfo?.asn === 'string' ? ipInfo.asn : 
             typeof ipInfo?.asn === 'object' ? `AS${ipInfo.asn.asn}` : "Não disponível",
        abuseContact: ipInfo?.asn?.abuse || ipInfo?.abuse?.email || "Não disponível",
        abuseScore: ipInfo?.asn?.abuser_score || null,
        rir: ipInfo?.asn?.rir?.toUpperCase() || "Não disponível",
        type: ipInfo?.asn?.type?.toUpperCase() || "Não disponível"
      };

      setWhoisData({
        registrar: registrarData,
        hosting: hostingData
      });
    } catch (err: any) {
      setError(err.message || "Erro ao consultar WHOIS");
      setWhoisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const whoisResult = whoisData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "serverHold":
      case "clientHold":
        return "destructive";
      case "ok":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "serverHold":
      case "clientHold":
        return <AlertTriangle className="h-4 w-4" />;
      case "ok":
        return <Shield className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 relative">
      {/* Subtle Background Gradient */}
      <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.1) 0%, transparent 50%), 
                          radial-gradient(ellipse at bottom right, rgba(255, 255, 255, 0.08) 0%, transparent 50%)`
            }}
          ></div>
          
          {/* Dot Grid Background Pattern */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          ></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            {/* Header Section */}
            <div className="mb-12">
              <div className="flex items-center gap-6 mb-8">
                <div className="p-3 bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl shadow-lg">
                  <Terminal className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2 font-apple">WHOIS Lookup</h1>
                  <p className="text-muted-foreground/80 text-lg">Análise completa de informações de domínio e infraestrutura</p>
                </div>
              </div>

              {/* Search Section */}
              <div className="flex gap-6 w-full mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
                  <Input 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Digite um domínio para análise..." 
                    className="pl-12 h-14 text-lg transition-all duration-300 shadow-lg"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={isLoading || !domain}
                  className="h-14 px-8 text-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Clock className="animate-spin mr-2 h-5 w-5" />
                      Consultando...
                    </div>
                  ) : (
                    "WHOIS"
                  )}
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Results Grid */}
            {whoisResult && (
                                                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                                    {/* Registrar Information */}
              <Card 
                className="border shadow-xl flex flex-col h-full relative overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                              radial-gradient(ellipse at bottom right, rgba(255, 255, 255, 0.08) 0%, transparent 50%)`
                }}
              >
                <CardHeader className="pb-6 border-b border-[#2E2E2E] relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold font-apple">
                      <div className="p-2 bg-secondary rounded-lg border shadow-md">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      Registrar
                    </CardTitle>
                    <Badge variant="outline" className="px-3 py-1">
                      <Network className="h-4 w-4 mr-2" />
                      ICANN
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8 flex-1 relative z-10">
                                            <div className="flex flex-col gap-6">
                            {/* Header Info */}
                            <div className="space-y-3">
                              <label className="text-muted-foreground text-sm font-medium block">Empresa Responsável</label>
                              <div className="p-4 bg-secondary rounded-lg border shadow-md">
                                <p className="text-white text-lg font-medium">{whoisResult.registrar.name}</p>
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-muted-foreground text-sm font-medium block">Data de Criação</label>
                                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border shadow-md">
                                  <Clock className="h-4 w-4 text-white/70" />
                                  <p className="text-white/90 text-sm font-medium">{whoisResult.registrar.creationDate}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-muted-foreground text-sm font-medium block">Data de Expiração</label>
                                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border shadow-md">
                                  <Clock className="h-4 w-4 text-white/70" />
                                  <p className="text-white/90 text-sm font-medium">{whoisResult.registrar.expirationDate}</p>
                                </div>
                              </div>
                            </div>

                            {/* Nameservers */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Nameservers</label>
                              <div className="grid grid-cols-1 gap-1">
                                {whoisResult.registrar.nameServers.map((ns, index) => (
                                  <div key={index} className="p-2 bg-secondary/30 rounded text-sm flex items-center">
                                    <Server className="h-4 w-4 mr-2 text-white/70" />
                                    {ns}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status ICANN */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Status ICANN</label>
                              <div className="grid grid-cols-1 gap-1">
                                {Array.isArray(whoisResult.registrar.status) ? (
                                  whoisResult.registrar.status.map((status, index) => (
                                    <Badge key={index} variant="destructive" className="flex items-center gap-2 p-2 text-sm">
                                      {getStatusIcon(status)}
                                      {status}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="destructive" className="flex items-center gap-2 p-2 text-sm">
                                    {getStatusIcon("unknown")}
                                    Não disponível
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Abuse Contact */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Contato de Abuse</label>
                              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border shadow-md">
                                <Mail className="h-4 w-4 text-white/70" />
                                <a 
                                  href={`mailto:${whoisResult.registrar.abuseContact}`}
                                  className="text-primary hover:text-primary/80 transition-colors duration-200 text-sm font-medium"
                                >
                                  {whoisResult.registrar.abuseContact}
                                </a>
                              </div>
                            </div>
                          </div>
                </CardContent>
              </Card>

              {/* Hosting Provider Information */}
              <Card 
                className="border shadow-xl flex flex-col h-full relative overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                              radial-gradient(ellipse at bottom right, rgba(255, 255, 255, 0.08) 0%, transparent 50%)`
                }}
              >
                <CardHeader className="pb-6 border-b border-[#2E2E2E] relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold font-apple">
                      <div className="p-2 bg-secondary rounded-lg border shadow-md">
                        <Server className="h-6 w-6 text-gray-400" />
                      </div>
                      Hosting Provider
                    </CardTitle>
                    <Badge variant="outline" className="px-3 py-1">
                      <Globe className="h-4 w-4 mr-2" />
                      ASN
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8 flex-1 relative z-10">
                                            <div className="flex flex-col gap-6">
                            {/* Header Info */}
                            <div className="space-y-3">
                              <label className="text-muted-foreground text-sm font-medium block">Empresa Responsável</label>
                              <div className="p-4 bg-secondary rounded-lg border shadow-md">
                                <p className="text-white text-lg font-medium">{whoisResult.hosting.provider}</p>
                              </div>
                            </div>

                            {/* ASN & CIDR */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-muted-foreground text-sm font-medium block">ASN</label>
                                <div className="p-3 bg-secondary rounded-lg border shadow-md">
                                  <code className="text-white font-mono text-sm font-medium">{whoisResult.hosting.asn}</code>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-muted-foreground text-sm font-medium block">CIDR</label>
                                <div className="p-3 bg-secondary rounded-lg border shadow-md">
                                  <code className="text-white font-mono text-sm font-medium">{whoisResult.hosting.cidr}</code>
                                </div>
                              </div>
                            </div>

                            {/* RIR */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Regional Internet Registry</label>
                              <div className="p-3 bg-secondary rounded-lg border shadow-md flex items-center justify-between">
                                <code className="text-white font-mono text-sm font-medium">{whoisResult.hosting.rir}</code>
                                <Badge variant="outline" className="font-mono">
                                  {whoisResult.hosting.rir}
                                </Badge>
                              </div>
                            </div>

                            {/* Type */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Type</label>
                              <div className="p-3 bg-secondary rounded-lg border shadow-md flex items-center justify-between">
                                <code className="text-white font-mono text-sm font-medium">{whoisResult.hosting.type}</code>
                                <Badge variant="outline" className="font-mono">
                                  {whoisResult.hosting.type}
                                </Badge>
                              </div>
                            </div>

                            {/* Abuse Score */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Abuse Score</label>
                              <div className="p-3 bg-secondary rounded-lg border shadow-md flex items-center justify-between">
                                <code className="text-white font-mono text-sm font-medium">{whoisResult.hosting.abuseScore || "Não disponível"}</code>
                                {whoisResult.hosting.abuseScore && (
                                  <Badge variant={
                                    parseFloat(whoisResult.hosting.abuseScore) > 0.7 ? "destructive" : 
                                    parseFloat(whoisResult.hosting.abuseScore) > 0.3 ? "warning" : 
                                    "success"
                                  }>
                                    {parseFloat(whoisResult.hosting.abuseScore) > 0.7 ? "High" : 
                                     parseFloat(whoisResult.hosting.abuseScore) > 0.3 ? "Medium" : 
                                     "Low"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Abuse Contact */}
                            <div className="space-y-2">
                              <label className="text-muted-foreground text-sm font-medium block">Contato de Abuse</label>
                              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border shadow-md">
                                <Mail className="h-4 w-4 text-white/70" />
                                <a 
                                  href={`mailto:${whoisResult.hosting.abuseContact}`}
                                  className="text-primary hover:text-primary/80 transition-colors duration-200 text-sm font-medium"
                                >
                                  {whoisResult.hosting.abuseContact}
                                </a>
                              </div>
                            </div>
                          </div>
                </CardContent>
              </Card>
            </div>
            )}
          </div>
    </div>
  );
}