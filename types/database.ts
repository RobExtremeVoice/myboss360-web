// Auto-maintained database types for MyBoss360.
// Regenerate with: npx supabase gen types typescript --project-id <ref> > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          website: string | null
          plan: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          website?: string | null
          plan?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          website?: string | null
          plan?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          description: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          description?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          created_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
        }
        Insert: {
          role_id: string
          permission_id: string
        }
        Update: {
          role_id?: string
          permission_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          workspace_id: string | null
          role_id: string | null
          status: string
          invited_email: string | null
          invited_at: string | null
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          workspace_id?: string | null
          role_id?: string | null
          status?: string
          invited_email?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          workspace_id?: string | null
          role_id?: string | null
          status?: string
          invited_email?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          workspace_id: string
          name: string
          domain: string | null
          industry: string | null
          size: string | null
          website: string | null
          phone: string | null
          address: Json
          notes: string | null
          tags: string[]
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          website?: string | null
          phone?: string | null
          address?: Json
          notes?: string | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          domain?: string | null
          industry?: string | null
          size?: string | null
          website?: string | null
          phone?: string | null
          address?: Json
          notes?: string | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          workspace_id: string
          company_id: string | null
          first_name: string
          last_name: string | null
          email: string | null
          phone: string | null
          job_title: string | null
          linkedin_url: string | null
          notes: string | null
          tags: string[]
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          company_id?: string | null
          first_name: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          notes?: string | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          company_id?: string | null
          first_name?: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          notes?: string | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          workspace_id: string
          contact_id: string | null
          company_id: string | null
          title: string
          source: string | null
          status: string
          assigned_to: string | null
          notes: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          contact_id?: string | null
          company_id?: string | null
          title: string
          source?: string | null
          status?: string
          assigned_to?: string | null
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          contact_id?: string | null
          company_id?: string | null
          title?: string
          source?: string | null
          status?: string
          assigned_to?: string | null
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          id: string
          workspace_id: string
          company_id: string | null
          contact_id: string | null
          lead_id: string | null
          title: string
          stage: string
          value: number | null
          currency: string
          probability: number | null
          expected_close_date: string | null
          closed_at: string | null
          assigned_to: string | null
          notes: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          company_id?: string | null
          contact_id?: string | null
          lead_id?: string | null
          title: string
          stage?: string
          value?: number | null
          currency?: string
          probability?: number | null
          expected_close_date?: string | null
          closed_at?: string | null
          assigned_to?: string | null
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          company_id?: string | null
          contact_id?: string | null
          lead_id?: string | null
          title?: string
          stage?: string
          value?: number | null
          currency?: string
          probability?: number | null
          expected_close_date?: string | null
          closed_at?: string | null
          assigned_to?: string | null
          notes?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          workspace_id: string
          type: string
          title: string
          body: string | null
          company_id: string | null
          contact_id: string | null
          lead_id: string | null
          deal_id: string | null
          occurred_at: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          type: string
          title: string
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          lead_id?: string | null
          deal_id?: string | null
          occurred_at?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          type?: string
          title?: string
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          lead_id?: string | null
          deal_id?: string | null
          occurred_at?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          status: string
          priority: string
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          owner_id: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          status?: string
          priority?: string
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          owner_id?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          status?: string
          priority?: string
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          owner_id?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          workspace_id: string
          project_id: string | null
          parent_task_id: string | null
          title: string
          description: string | null
          status: string
          priority: string
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          project_id?: string | null
          parent_task_id?: string | null
          title: string
          description?: string | null
          status?: string
          priority?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          project_id?: string | null
          parent_task_id?: string | null
          title?: string
          description?: string | null
          status?: string
          priority?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          workspace_id: string
          title: string
          description: string | null
          location: string | null
          start_at: string
          end_at: string
          all_day: boolean
          recurrence: Json | null
          organizer_id: string | null
          attendees: string[]
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          description?: string | null
          location?: string | null
          start_at: string
          end_at: string
          all_day?: boolean
          recurrence?: Json | null
          organizer_id?: string | null
          attendees?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          description?: string | null
          location?: string | null
          start_at?: string
          end_at?: string
          all_day?: boolean
          recurrence?: Json | null
          organizer_id?: string | null
          attendees?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          workspace_id: string
          parent_id: string | null
          title: string
          content: string | null
          content_type: string
          is_folder: boolean
          storage_path: string | null
          mime_type: string | null
          size_bytes: number | null
          tags: string[]
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          parent_id?: string | null
          title: string
          content?: string | null
          content_type?: string
          is_folder?: boolean
          storage_path?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          parent_id?: string | null
          title?: string
          content?: string | null
          content_type?: string
          is_folder?: boolean
          storage_path?: string | null
          mime_type?: string | null
          size_bytes?: number | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          type: string
          title: string
          body: string | null
          action_url: string | null
          read_at: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          type: string
          title: string
          body?: string | null
          action_url?: string | null
          read_at?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          type?: string
          title?: string
          body?: string | null
          action_url?: string | null
          read_at?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          title: string | null
          model: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          title?: string | null
          model?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          title?: string | null
          model?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens_used?: number | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          trial_end: string | null
          canceled_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          canceled_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          trial_end?: string | null
          canceled_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          workspace_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          workspace_id?: string | null
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          workspace_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_org_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { ws_id: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row-type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
