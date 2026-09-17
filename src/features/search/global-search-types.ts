export interface GlobalSearchProject {
  projectId: string;
  code: string;
  name: string;
  clientName: string;
}

export interface GlobalSearchPreQuote {
  preQuoteId: string;
  serial: string;
  name: string | null;
  projectId: string;
  projectCode: string;
  projectName: string;
}

export interface GlobalSearchClient {
  clientId: string;
  name: string;
  documentType: string | null;
  documentNumber: string | null;
}

export interface GlobalSearchResult {
  projects: GlobalSearchProject[];
  preQuotes: GlobalSearchPreQuote[];
  clients: GlobalSearchClient[];
}