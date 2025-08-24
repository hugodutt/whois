import { useState } from "react";
import { Globe, ArrowRight, Calendar, Database, Server, Shield, Loader2, Cloud } from "lucide-react";
import { getWhoisInfo, getIPInfo } from "@/lib/domain-info";

interface WhoisResult {
  domain: string;
  registrar: string;
  createdDate: string;
  expiryDate: string;
  updatedDate: string;
  nameServers: string[];
  status: string[];
  registrant?: {
    name?: string;
    organization?: string;
    country?: string;
  };
  ipInfo?: {
    ip: string;
    asn: string;
    provider: string;
    country: string;
    city: string;
    abuse_contact: {
      email: string;
      phone: string;
    };
  };
  dnsInfo?: any;
  error?: string;
  rawWhois: any;
}

const WhoisPage = () => {
  const [domains, setDomains] = useState<string>("");
  const [results, setResults] = useState<WhoisResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setResults(null);
    setSelectedDomain(null);
    
    const domainList = domains.split("\n").filter(domain => domain.trim() !== "").map(domain => domain.trim());
    const whoisResults: WhoisResult[] = [];
    
    for (const domain of domainList) {
      const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
      const isValidFormat = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(cleanDomain);
      if (!isValidFormat) {
        whoisResults.push({
          domain: cleanDomain,
          registrar: "",
          createdDate: "",
          expiryDate: "",
          updatedDate: "",
          nameServers: [],
          status: [],
          error: "Formato de domínio inválido",
          rawWhois: null
        });
        continue;
      }
      try {
        // Consulta real à API de WHOIS
        const whoisData = await getWhoisInfo(cleanDomain);
        // Buscar IP do domínio
        let ipInfo = undefined;
        let dnsInfo = undefined;
        try {
          const dnsRes = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`);
          dnsInfo = await dnsRes.json();
          if (dnsInfo.Answer && dnsInfo.Answer.length > 0) {
            const ip = dnsInfo.Answer[0].data;
            ipInfo = await getIPInfo(ip);
          }
        } catch (err) {
          // Ignorar erro de IP/DNS
        }
        whoisResults.push({
          domain: cleanDomain,
          registrar: whoisData.registrar || "",
          createdDate: whoisData.creation_date || "",
          expiryDate: whoisData.expiration_date || "",
          updatedDate: whoisData.updated_date || "",
          nameServers: whoisData.name_servers || [],
          status: [],
          ipInfo,
          dnsInfo,
          rawWhois: whoisData
        });
      } catch (error: any) {
        whoisResults.push({
          domain: cleanDomain,
          registrar: "",
          createdDate: "",
          expiryDate: "",
          updatedDate: "",
          nameServers: [],
          status: [],
          error: error.message || "Erro ao consultar WHOIS",
          rawWhois: null
        });
      }
    }
    
    setResults(whoisResults);
    if (whoisResults.length > 0) {
      setSelectedDomain(whoisResults[0].domain);
    }
    setIsLoading(false);
  };
  
  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain);
  };
  
  const getSelectedDomainData = () => {
    if (!results || !selectedDomain) return null;
    return results.find(r => r.domain === selectedDomain);
  };
  
  const selectedData = getSelectedDomainData();
  
  const registrar = selectedData && selectedData.rawWhois ? selectedData.rawWhois.registrar?.name || "Não disponível" : "Não disponível";
  const status = selectedData && selectedData.rawWhois ? selectedData.rawWhois.status || "Não disponível" : "Não disponível";
  const creationDate = selectedData && selectedData.rawWhois ? selectedData.rawWhois.created || "Não disponível" : "Não disponível";
  const expirationDate = selectedData && selectedData.rawWhois ? selectedData.rawWhois.expires || "Não disponível" : "Não disponível";
  const updatedDate = selectedData && selectedData.rawWhois ? selectedData.rawWhois.changed || "Não disponível" : "Não disponível";
  const nameServers = selectedData && selectedData.rawWhois ? (selectedData.rawWhois.nameserver || []) : [];
  
  const provider = selectedData && selectedData.ipInfo ? (
    (selectedData.ipInfo as any).company?.name ||
    (selectedData.ipInfo as any).datacenter?.datacenter ||
    (selectedData.ipInfo as any).asn?.org ||
    selectedData.ipInfo.provider ||
    "Não disponível"
  ) : "Não disponível";
  const asn = selectedData && selectedData.ipInfo ? (
    (selectedData.ipInfo as any).asn?.asn ||
    selectedData.ipInfo.asn ||
    "Não disponível"
  ) : "Não disponível";
  const country = selectedData && selectedData.ipInfo ? (
    (selectedData.ipInfo as any).location?.country ||
    selectedData.ipInfo.country ||
    "Não disponível"
  ) : "Não disponível";
  const city = selectedData && selectedData.ipInfo ? (
    (selectedData.ipInfo as any).location?.city ||
    selectedData.ipInfo.city ||
    "Não disponível"
  ) : "Não disponível";
  const abuseEmail = selectedData && selectedData.ipInfo ? (
    (selectedData.ipInfo as any).abuse?.email ||
    selectedData.ipInfo.abuse_contact?.email ||
    "Não disponível"
  ) : "Não disponível";
  const abusePhone = selectedData && selectedData.ipInfo ? (
    (selectedData.ipInfo as any).abuse?.phone ||
    selectedData.ipInfo.abuse_contact?.phone ||
    "Não disponível"
  ) : "Não disponível";
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-primary mr-2" />
            <h1 className="text-2xl font-bold">WHOIS</h1>
          </div>
          <p className="text-muted-foreground">
            Consulte dados WHOIS de um domínio para obter informações sobre registros, datas, servidores DNS e Hosting Provider.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Consultar domínios</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Insira um ou mais domínios para consulta, um por linha.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <textarea
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    placeholder="exemplo.com&#10;meusite.com.br&#10;outrodominio.net"
                    rows={8}
                    className="w-full px-3 py-2 bg-secondary rounded-md border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || domains.trim() === ""}
                  className={`w-full flex justify-center items-center py-2.5 rounded-md text-sm font-medium ${
                    isLoading || domains.trim() === "" 
                      ? "bg-primary/70 cursor-not-allowed" 
                      : "bg-primary hover:bg-primary/90"
                  } text-primary-foreground transition-colors`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      Consultar WHOIS <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Domínios consultados:</h3>
                
                {isLoading && (
                  <div className="flex items-center justify-center h-20 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Carregando...</span>
                  </div>
                )}
                
                {!isLoading && !results && (
                  <div className="text-sm text-muted-foreground py-4">
                    Nenhuma consulta realizada.
                  </div>
                )}
                
                {!isLoading && results && results.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {results.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectDomain(result.domain)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedDomain === result.domain 
                            ? "bg-primary/20 text-primary" 
                            : "bg-secondary hover:bg-secondary/70"
                        }`}
                      >
                        {result.domain}
                        {result.error && (
                          <span className="block text-xs text-red-400 mt-0.5">
                            Erro: {result.error}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Results */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Resultado WHOIS</h2>
              
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Consultando informações WHOIS...</p>
                </div>
              )}
              
              {!isLoading && !selectedData && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Globe className="h-12 w-12 mb-4 opacity-20" />
                  <p>Selecione um domínio para ver os detalhes</p>
                </div>
              )}
              
              {!isLoading && selectedData && selectedData.error && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <div className="bg-red-500/10 p-4 rounded-md text-center">
                    <p className="text-red-400 mb-2">Erro na consulta</p>
                    <p>{selectedData.error}</p>
                  </div>
                </div>
              )}
              
              {!isLoading && selectedData && !selectedData.error && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{selectedData.domain}</h3>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {selectedData.status.includes("ok") ? "Status: OK" : "Status: Protegido"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Informações de registro */}
                      {selectedData && selectedData.rawWhois ? (
                        <>
                          <div className="bg-secondary/30 p-4 rounded-md">
                            <div className="flex items-center mb-3">
                              <Database className="h-5 w-5 text-primary mr-2" />
                              <h4 className="font-medium">Informações de Registro</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">Registrar:</span>
                                <span className="col-span-2">{registrar}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">Status:</span>
                                <span className="col-span-2 break-all flex flex-col gap-1">
                                  {Array.isArray(status)
                                    ? status.map((s, i) => <span key={i}>{s}</span>)
                                    : status}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">Criado:</span>
                                <span className="col-span-2">{creationDate}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">Expira:</span>
                                <span className="col-span-2">{expirationDate}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-muted-foreground">Atualizado:</span>
                                <span className="col-span-2">{updatedDate}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Servidores de nome */}
                          <div className="bg-secondary/30 p-4 rounded-md">
                            <div className="flex items-center mb-3">
                              <Server className="h-5 w-5 text-primary mr-2" />
                              <h4 className="font-medium">Servidores DNS</h4>
                            </div>
                            <div className="space-y-1 text-sm">
                              {nameServers.map((ns: string, idx: number) => (
                                <div key={idx} className="py-1 px-2 bg-secondary/30 rounded">{ns}</div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Hosting Provider */}
                          {selectedData && selectedData.ipInfo && (
                            <div className="bg-secondary/30 p-4 rounded-md">
                              <div className="flex items-center mb-3">
                                <Cloud className="h-5 w-5 text-primary mr-2" />
                                <h4 className="font-medium">Hosting Provider</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-muted-foreground">Provedor:</span>
                                  <span className="col-span-2">{provider}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-muted-foreground">ASN:</span>
                                  <span className="col-span-2">{asn}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-muted-foreground">País:</span>
                                  <span className="col-span-2">{country}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-muted-foreground">Cidade:</span>
                                  <span className="col-span-2">{city}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-muted-foreground">Abuse Email:</span>
                                  <span className="col-span-2">{abuseEmail}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <span className="text-muted-foreground">Abuse Phone:</span>
                                  <span className="col-span-2">{abusePhone}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-muted-foreground">Nenhum dado WHOIS disponível.</div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {/* Datas importantes */}
                      {selectedData && selectedData.rawWhois ? (
                        <div className="bg-secondary/30 p-4 rounded-md">
                          <div className="flex items-center mb-3">
                            <Calendar className="h-5 w-5 text-primary mr-2" />
                            <h4 className="font-medium">Datas</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="text-muted-foreground">Criado:</span>
                              <span className="col-span-2">{creationDate}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <span className="text-muted-foreground">Expira:</span>
                              <span className="col-span-2">{expirationDate}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <span className="text-muted-foreground">Atualizado:</span>
                              <span className="col-span-2">{updatedDate}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">Nenhum dado WHOIS disponível.</div>
                      )}
                      
                      {/* Status do domínio */}
                      {selectedData && selectedData.rawWhois ? (
                        <div className="bg-secondary/30 p-4 rounded-md">
                          <div className="flex items-center mb-3">
                            <Shield className="h-5 w-5 text-primary mr-2" />
                            <h4 className="font-medium">Status do Domínio</h4>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="py-1 px-2 bg-secondary/30 rounded flex items-center">
                              <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                              {status}
                            </div>
                            {Array.isArray(status) && (status.some(s => s.toLowerCase().includes('clienthold')) || status.some(s => s.toLowerCase().includes('serverhold'))) && (
                              <div className="mt-2 p-2 bg-yellow-500/10 text-yellow-600 rounded-md text-xs break-all">
                                ⚠️ Este domínio está congelado e não está mais ativo. Status: {status.find(s => s.toLowerCase().includes('clienthold') || s.toLowerCase().includes('serverhold'))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">Nenhum dado WHOIS disponível.</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-md">
                    <p>
                      Nota: As informações WHOIS são fornecidas por registradores e registries. 
                      Alguns dados podem estar protegidos por políticas de privacidade.
                    </p>
                  </div>
                </div>
              )}
              {selectedData && selectedData.rawWhois && (
                <div className="bg-secondary/30 p-4 rounded-md mt-4">
                  <div className="flex items-center mb-3">
                    <Database className="h-5 w-5 text-primary mr-2" />
                    <h4 className="font-medium">Dados completos do WHOIS (JSON)</h4>
                  </div>
                  <pre className="text-xs bg-background text-foreground p-3 rounded overflow-x-auto border border-border">
                    {JSON.stringify(selectedData.rawWhois, null, 2)}
                  </pre>
                </div>
              )}
              {selectedData && selectedData.ipInfo && (
                <div className="bg-secondary/30 p-4 rounded-md mt-4">
                  <div className="flex items-center mb-3">
                    <Cloud className="h-5 w-5 text-primary mr-2" />
                    <h4 className="font-medium">Dados completos do Hosting Provider (JSON)</h4>
                  </div>
                  <pre className="text-xs bg-background text-foreground p-3 rounded overflow-x-auto border border-border">
                    {JSON.stringify(selectedData.ipInfo, null, 2)}
                  </pre>
                </div>
              )}
              {selectedData && selectedData.dnsInfo && (
                <div className="bg-secondary/30 p-4 rounded-md mt-4">
                  <div className="flex items-center mb-3">
                    <Server className="h-5 w-5 text-primary mr-2" />
                    <h4 className="font-medium">Dados completos do DNS (JSON)</h4>
                  </div>
                  <pre className="text-xs bg-background text-foreground p-3 rounded overflow-x-auto border border-border">
                    {JSON.stringify(selectedData.dnsInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-card mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-foreground/60">
          &copy; {new Date().getFullYear()} TKDHub. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default WhoisPage;
