export interface UserDashboardRecentProject {
  projectId: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  isActive: boolean;
  updatedAtUtc: string;
}

export interface UserDashboardAttentionItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  preQuoteId: string;
  preQuoteSerial: string;
  preQuoteName: string | null;
  requirementId: string;
  type: string;
  title: string;
  description: string;
  updatedAtUtc: string;
}

export interface UserDashboard {
  activeProjects: number;
  totalPreQuotes: number;
  requirementsInProgress: number;
  proposalsRequiringReview: number;
  recentProjects: UserDashboardRecentProject[];
  attentionItems: UserDashboardAttentionItem[];
  recentActivity: UserDashboardActivityItem[];
}

export interface UserDashboardActivityItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  preQuoteId: string | null;
  preQuoteSerial: string | null;
  preQuoteName: string | null;
  type: string;
  title: string;
  description: string;
  occurredAtUtc: string;
}