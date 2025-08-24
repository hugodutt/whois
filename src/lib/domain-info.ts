import { env } from "@/env";

// Interface para os dados do Whois
interface WhoisData {
  domain: string;
  registrar: string;
  registrant: string;
  creation_date: string;
  expiration_date: string;
  updated_date: string;
  name_servers: string[];
  abuse_contact: {
    email: string;
    phone: string;
  };
}

// Interface para os dados do IP
interface IPData {
  ip: string;
  asn: string;
  provider: string;
  country: string;
  city: string;
  abuse_contact: {
    email: string;
    phone: string;
  };
}

// Função para obter informações do Whois usando WhoisJSON.com
export async function getWhoisInfo(domain: string): Promise<any> {
  try {
    console.log('API KEY SENDO USADA:', env.VITE_WHOISJSON_API_KEY);
    const response = await fetch(
      `https://whoisjson.com/api/v1/whois?domain=${domain}&format=json`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `TOKEN=${env.VITE_WHOISJSON_API_KEY}`
        }
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar dados do Whois: ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar dados do Whois:', error);
    throw error;
  }
}

// Função para obter informações do IP
export async function getIPInfo(ip: string): Promise<IPData> {
  try {
    const response = await fetch('https://api.ipapi.is', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: ip,
        key: env.VITE_IPAPI_KEY
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados do IP: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      ip: data.ip,
      asn: data.asn,
      provider: data.isp,
      country: data.country,
      city: data.city,
      abuse_contact: {
        email: data.abuse_contact?.email || 'Não disponível',
        phone: data.abuse_contact?.phone || 'Não disponível'
      }
    };
  } catch (error) {
    console.error('Erro ao buscar dados do IP:', error);
    throw error;
  }
}

// Função principal para obter todas as informações do domínio
export async function getDomainInfo(domain: string): Promise<{
  whois: WhoisData;
  ipInfo: IPData[];
}> {
  try {
    // Primeiro obtemos os dados do Whois
    const whoisData = await getWhoisInfo(domain);
    
    // Obtemos informações de cada IP
    const ipInfoPromises = whoisData.name_servers.map(async (ns) => {
      try {
        const response = await fetch(`https://dns.google/resolve?name=${ns}&type=A`);
        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          return getIPInfo(data.Answer[0].data);
        }
        return null;
      } catch (error) {
        console.error(`Erro ao resolver IP do nameserver ${ns}:`, error);
        return null;
      }
    });

    const ipInfoResults = (await Promise.all(ipInfoPromises)).filter(Boolean) as IPData[];
    
    return {
      whois: whoisData,
      ipInfo: ipInfoResults
    };
  } catch (error) {
    console.error('Erro ao obter informações do domínio:', error);
    throw error;
  }
}
