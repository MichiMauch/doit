import { type JiraIssue, type NewJiraIssue } from "@/lib/db/schema";

export interface JiraConfig {
  url: string;
  email: string;
  token: string;
}

export interface JiraIssueResponse {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    project: {
      key: string;
    };
    issuetype: {
      name: string;
    };
    duedate?: string;
    created: string;
    updated: string;
    sprint?: {
      id: number;
      name: string;
      state: string;
    }[];
    customfield_10020?: {
      id: number;
      name: string;
      state: string;
    }[];
  };
}

export interface JiraSearchResponse {
  issues: JiraIssueResponse[];
  total: number;
  startAt: number;
  maxResults: number;
}

export class JiraService {
  private config: JiraConfig;
  private baseUrl: string;
  private auth: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `${config.url}/rest/api/2`;
    this.auth = Buffer.from(`${config.email}:${config.token}`).toString('base64');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("Making request to:", url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jira API Error Response:", errorText);
      throw new Error(`Jira API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getAssignedIssues(projects: string[] = []): Promise<Omit<JiraIssue, 'userEmail'>[]> {
    const projectFilter = projects.length > 0 
      ? `project IN (${projects.map(p => `"${p}"`).join(',')}) AND `
      : '';
    
    const jql = `${projectFilter}assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC`;
    
    const response = await this.makeRequest<JiraSearchResponse>(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=100`
    );

    return response.issues.map(this.transformJiraIssue);
  }

  async getIssuesByProjects(projects: string[]): Promise<Omit<JiraIssue, 'userEmail'>[]> {
    if (projects.length === 0) return [];

    // JQL with sprint fields - request specific fields including sprint
    const jql = `project IN (${projects.map(p => `"${p}"`).join(',')}) AND assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC`;
    
    console.log("JQL Query:", jql);
    
    try {
      // Get issues with expanded sprint information
      const response = await this.makeRequest<JiraSearchResponse>(
        `/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=*all&expand=changelog`
      );

      console.log("Jira API Response with sprint data:", response);
      
      // Get board information for better sprint data
      const issuesWithSprints = await this.enrichWithSprintData(response.issues);
      
      return issuesWithSprints.map(this.transformJiraIssue);
    } catch (error) {
      console.error("Jira API Error:", error);
      throw error;
    }
  }

  async getProjects(): Promise<{ key: string; name: string }[]> {
    const response = await this.makeRequest<any[]>('/project');
    return response.map(project => ({
      key: project.key,
      name: project.name
    }));
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/myself');
      return true;
    } catch (error) {
      console.error('Jira connection test failed:', error);
      return false;
    }
  }

  private async enrichWithSprintData(issues: JiraIssueResponse[]): Promise<JiraIssueResponse[]> {
    // Try to get board info for each project to get better sprint data
    const enrichedIssues: JiraIssueResponse[] = [];
    
    for (const issue of issues) {
      try {
        // Try to get current sprint from different custom fields
        const enrichedIssue = { ...issue };
        
        // Log all custom fields to see what's available
        console.log(`Issue ${issue.key} fields:`, Object.keys(issue.fields).filter(key => key.startsWith('customfield')));
        
        // Try different common sprint custom field IDs
        const sprintFields = ['customfield_10020', 'customfield_10010', 'customfield_10016'];
        
        for (const fieldId of sprintFields) {
          const fieldValue = (issue.fields as any)[fieldId];
          if (fieldValue) {
            console.log(`Sprint field ${fieldId} for ${issue.key}:`, fieldValue);
            
            // Handle different sprint field formats
            if (Array.isArray(fieldValue)) {
              // Sprint objects array
              const activeSprint = fieldValue.find((s: any) => s.state === 'active') || fieldValue[0];
              if (activeSprint && activeSprint.name) {
                enrichedIssue.fields.sprint = fieldValue;
                break;
              }
            } else if (typeof fieldValue === 'string') {
              // Parse sprint string (common format)
              const sprintMatch = fieldValue.match(/name=([^,\]]+)/);
              if (sprintMatch) {
                enrichedIssue.fields.sprint = [{ id: 0, name: sprintMatch[1], state: 'active' }];
                break;
              }
            }
          }
        }
        
        enrichedIssues.push(enrichedIssue);
      } catch (error) {
        console.error(`Error enriching issue ${issue.key}:`, error);
        enrichedIssues.push(issue);
      }
    }
    
    return enrichedIssues;
  }

  private transformJiraIssue(issue: JiraIssueResponse): Omit<JiraIssue, 'userEmail'> {
    // Extract sprint information - try different field names
    let sprintName = null;
    let sprintState = null;
    
    // Try standard sprint field
    if (issue.fields.sprint && issue.fields.sprint.length > 0) {
      const activeSprint = issue.fields.sprint.find(s => s.state === 'active') || issue.fields.sprint[0];
      sprintName = activeSprint.name;
      sprintState = activeSprint.state;
    }
    
    // Try customfield_10020 (common Sprint field)
    if (!sprintName && issue.fields.customfield_10020 && issue.fields.customfield_10020.length > 0) {
      const activeSprint = issue.fields.customfield_10020.find(s => s.state === 'active') || issue.fields.customfield_10020[0];
      sprintName = activeSprint.name;
      sprintState = activeSprint.state;
    }
    
    return {
      id: 0, // Will be set by database
      jiraId: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description || null,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || null,
      assignee: issue.fields.assignee?.displayName || null,
      project: issue.fields.project.key,
      issueType: issue.fields.issuetype.name,
      dueDate: issue.fields.duedate ? new Date(issue.fields.duedate) : null,
      sprint: sprintName,
      sprintState: sprintState,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
    };
  }
}

export function createJiraService(config: JiraConfig): JiraService {
  return new JiraService(config);
}