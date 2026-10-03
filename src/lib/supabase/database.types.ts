export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string;
          after: Json | null;
          before: Json | null;
          client_id: string | null;
          id: number;
          occurred_at: string;
          record_id: string | null;
          table_name: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role: string;
          after?: Json | null;
          before?: Json | null;
          client_id?: string | null;
          id?: never;
          occurred_at?: string;
          record_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string;
          after?: Json | null;
          before?: Json | null;
          client_id?: string | null;
          id?: never;
          occurred_at?: string;
          record_id?: string | null;
          table_name?: string;
        };
        Relationships: [];
      };
      budget_buckets: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string | null;
          name: string;
          removed_at: string | null;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: string | null;
          name: string;
          removed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: string | null;
          name?: string;
          removed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_buckets_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_buckets_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_costs: {
        Row: {
          amount: number;
          bucket_id: string;
          client_id: string;
          created_at: string;
          description: string;
          event_id: string | null;
          id: string;
          incurred_on: string;
          note: string | null;
          original_start: string;
          paid_on: string | null;
          recorded_by: string;
          recorded_by_name: string;
          seq: number;
          status: string;
        };
        Insert: {
          amount: number;
          bucket_id: string;
          client_id: string;
          created_at?: string;
          description: string;
          event_id?: string | null;
          id?: string;
          incurred_on: string;
          note?: string | null;
          original_start: string;
          paid_on?: string | null;
          recorded_by: string;
          recorded_by_name: string;
          seq?: never;
          status: string;
        };
        Update: {
          amount?: number;
          bucket_id?: string;
          client_id?: string;
          created_at?: string;
          description?: string;
          event_id?: string | null;
          id?: string;
          incurred_on?: string;
          note?: string | null;
          original_start?: string;
          paid_on?: string | null;
          recorded_by?: string;
          recorded_by_name?: string;
          seq?: never;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_costs_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "budget_buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_costs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_costs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "care_events";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_fund_entries: {
        Row: {
          amount: number;
          bucket_id: string;
          client_id: string;
          created_at: string;
          description: string;
          entry_date: string;
          id: string;
          kind: string;
          note: string | null;
          recorded_by: string;
          recorded_by_name: string;
          seq: number;
        };
        Insert: {
          amount: number;
          bucket_id: string;
          client_id: string;
          created_at?: string;
          description?: string;
          entry_date?: string;
          id?: string;
          kind: string;
          note?: string | null;
          recorded_by: string;
          recorded_by_name: string;
          seq?: never;
        };
        Update: {
          amount?: number;
          bucket_id?: string;
          client_id?: string;
          created_at?: string;
          description?: string;
          entry_date?: string;
          id?: string;
          kind?: string;
          note?: string | null;
          recorded_by?: string;
          recorded_by_name?: string;
          seq?: never;
        };
        Relationships: [
          {
            foreignKeyName: "budget_fund_entries_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "budget_buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_fund_entries_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_pending_cost_notifications: {
        Row: {
          cost_id: string;
          sent_at: string;
        };
        Insert: {
          cost_id: string;
          sent_at?: string;
        };
        Update: {
          cost_id?: string;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_pending_cost_notifications_cost_id_fkey";
            columns: ["cost_id"];
            isOneToOne: true;
            referencedRelation: "budget_costs";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_threshold_notifications: {
        Row: {
          bucket_id: string;
          id: string;
          period_start: string;
          sent_at: string;
          threshold: number;
        };
        Insert: {
          bucket_id: string;
          id?: string;
          period_start: string;
          sent_at?: string;
          threshold: number;
        };
        Update: {
          bucket_id?: string;
          id?: string;
          period_start?: string;
          sent_at?: string;
          threshold?: number;
        };
        Relationships: [
          {
            foreignKeyName: "budget_threshold_notifications_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "budget_buckets";
            referencedColumns: ["id"];
          },
        ];
      };
      care_event_completions: {
        Row: {
          action: string;
          actor_display_name: string;
          actor_id: string;
          client_id: string;
          event_id: string;
          id: string;
          occurred_at: string;
          organisation_id: string | null;
          original_start: string;
          seq: number;
        };
        Insert: {
          action: string;
          actor_display_name: string;
          actor_id: string;
          client_id: string;
          event_id: string;
          id?: string;
          occurred_at?: string;
          organisation_id?: string | null;
          original_start: string;
          seq?: never;
        };
        Update: {
          action?: string;
          actor_display_name?: string;
          actor_id?: string;
          client_id?: string;
          event_id?: string;
          id?: string;
          occurred_at?: string;
          organisation_id?: string | null;
          original_start?: string;
          seq?: never;
        };
        Relationships: [
          {
            foreignKeyName: "care_event_completions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "care_event_completions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "care_events";
            referencedColumns: ["id"];
          },
        ];
      };
      care_event_overrides: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          event_id: string;
          id: string;
          kind: string;
          new_completion_mode: string | null;
          new_duration_minutes: number | null;
          new_starts_at: string | null;
          original_start: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          event_id: string;
          id?: string;
          kind: string;
          new_completion_mode?: string | null;
          new_duration_minutes?: number | null;
          new_starts_at?: string | null;
          original_start: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          event_id?: string;
          id?: string;
          kind?: string;
          new_completion_mode?: string | null;
          new_duration_minutes?: number | null;
          new_starts_at?: string | null;
          original_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "care_event_overrides_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "care_event_overrides_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "care_event_overrides_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "care_events";
            referencedColumns: ["id"];
          },
        ];
      };
      care_events: {
        Row: {
          bucket_id: string | null;
          client_id: string;
          completion_mode: string;
          cost: number | null;
          cost_set_at: string | null;
          created_at: string;
          created_by: string | null;
          deactivated_at: string | null;
          description: string;
          duration_minutes: number;
          id: string;
          is_active: boolean;
          recurrence: Json | null;
          recurrence_until: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          bucket_id?: string | null;
          client_id: string;
          completion_mode?: string;
          cost?: number | null;
          cost_set_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          deactivated_at?: string | null;
          description?: string;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          recurrence?: Json | null;
          recurrence_until?: string | null;
          starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          bucket_id?: string | null;
          client_id?: string;
          completion_mode?: string;
          cost?: number | null;
          cost_set_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          deactivated_at?: string | null;
          description?: string;
          duration_minutes?: number;
          id?: string;
          is_active?: boolean;
          recurrence?: Json | null;
          recurrence_until?: string | null;
          starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "care_events_bucket_id_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "budget_buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "care_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "care_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      care_overdue_alert_notifications: {
        Row: {
          event_id: string;
          original_start: string;
          sent_at: string;
        };
        Insert: {
          event_id: string;
          original_start: string;
          sent_at?: string;
        };
        Update: {
          event_id?: string;
          original_start?: string;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "care_overdue_alert_notifications_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "care_events";
            referencedColumns: ["id"];
          },
        ];
      };
      carer_notifications: {
        Row: {
          client_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          message: string;
          read_at: string | null;
          recipient_id: string;
          shift_id: string | null;
          source: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          message: string;
          read_at?: string | null;
          recipient_id: string;
          shift_id?: string | null;
          source: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string;
          read_at?: string | null;
          recipient_id?: string;
          shift_id?: string | null;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carer_notifications_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carer_notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carer_notifications_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
        ];
      };
      client_family_members: {
        Row: {
          client_id: string;
          profile_id: string;
          relationship_label: string | null;
        };
        Insert: {
          client_id: string;
          profile_id: string;
          relationship_label?: string | null;
        };
        Update: {
          client_id?: string;
          profile_id?: string;
          relationship_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_family_members_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_family_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      client_info_sections: {
        Row: {
          body: string | null;
          client_id: string;
          key: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string | null;
          client_id: string;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string | null;
          client_id?: string;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_info_sections_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_info_sections_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          date_of_birth: string | null;
          first_name: string;
          id: string;
          last_name: string;
          organisation_id: string | null;
          organisation_removed_at: string | null;
          suburb: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          organisation_id?: string | null;
          organisation_removed_at?: string | null;
          suburb?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          organisation_id?: string | null;
          organisation_removed_at?: string | null;
          suburb?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          client_id: string;
          detached_at: string | null;
          event_id: string | null;
          filename: string;
          id: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          uploaded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          client_id: string;
          detached_at?: string | null;
          event_id?: string | null;
          filename: string;
          id?: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          client_id?: string;
          detached_at?: string | null;
          event_id?: string | null;
          filename?: string;
          id?: string;
          mime_type?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "care_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organisations: {
        Row: {
          abn: string | null;
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          phone: string | null;
        };
        Insert: {
          abn?: string | null;
          address?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          phone?: string | null;
        };
        Update: {
          abn?: string | null;
          address?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          address: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_name: string | null;
          organisation_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          address?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          is_active?: boolean;
          job_title?: string | null;
          last_name?: string | null;
          organisation_id?: string | null;
          phone?: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          address?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          last_name?: string | null;
          organisation_id?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
      shifts: {
        Row: {
          cancelled_at: string | null;
          carer_id: string;
          client_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string;
          id: string;
          organisation_id: string;
          starts_at: string;
        };
        Insert: {
          cancelled_at?: string | null;
          carer_id: string;
          client_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at: string;
          id?: string;
          organisation_id: string;
          starts_at: string;
        };
        Update: {
          cancelled_at?: string | null;
          carer_id?: string;
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string;
          id?: string;
          organisation_id?: string;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_carer_id_fkey";
            columns: ["carer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_bucket: {
        Args: {
          p_client_id: string;
          p_kind?: string;
          p_name: string;
          p_note?: string;
          p_starting_amount: number;
        };
        Returns: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string | null;
          name: string;
          removed_at: string | null;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "budget_buckets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      add_funds: {
        Args: { p_amount: number; p_bucket_id: string; p_note?: string };
        Returns: {
          amount: number;
          bucket_id: string;
          client_id: string;
          created_at: string;
          description: string;
          entry_date: string;
          id: string;
          kind: string;
          note: string | null;
          recorded_by: string;
          recorded_by_name: string;
          seq: number;
        };
        SetofOptions: {
          from: "*";
          to: "budget_fund_entries";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_check_staff_fields: {
        Args: { p_email: string; p_first_name: string; p_last_name: string };
        Returns: undefined;
      };
      admin_create_staff_profile: {
        Args: {
          p_email: string;
          p_first_name: string;
          p_job_title: string;
          p_last_name: string;
          p_phone: string;
          p_user_id: string;
        };
        Returns: {
          address: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_name: string | null;
          organisation_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_current_org_id: { Args: never; Returns: string };
      admin_deactivate_staff: {
        Args: { p_profile_id: string };
        Returns: {
          address: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_name: string | null;
          organisation_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_discard_staff_invite: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      admin_end_carer_assignment: {
        Args: { p_carer_id: string; p_client_id: string };
        Returns: number;
      };
      admin_pending_staff_ids: { Args: never; Returns: string[] };
      admin_remove_client: { Args: { p_client_id: string }; Returns: undefined };
      admin_update_organisation: {
        Args: {
          p_abn: string;
          p_address: string;
          p_name: string;
          p_phone: string;
        };
        Returns: {
          abn: string | null;
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          phone: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "organisations";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      admin_update_staff: {
        Args: {
          p_email: string;
          p_first_name: string;
          p_job_title: string;
          p_last_name: string;
          p_phone: string;
          p_profile_id: string;
        };
        Returns: {
          address: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_name: string | null;
          organisation_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      budget_actor_name: { Args: never; Returns: string };
      budget_bucket_balance: { Args: { p_bucket_id: string }; Returns: number };
      budget_bucket_for_write: {
        Args: { p_bucket_id: string };
        Returns: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string | null;
          name: string;
          removed_at: string | null;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "budget_buckets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      budget_bucket_summary: {
        Args: { p_client_id: string };
        Returns: {
          bucket_id: string;
          kind: string;
          name: string;
          pending_count: number;
          pending_total: number;
          percent_used: number;
          period_end: string;
          period_start: string;
          period_used: number;
          remaining: number;
          threshold_state: string;
          total: number;
          used: number;
        }[];
      };
      budget_check_amount: {
        Args: { p_allow_zero?: boolean; p_amount: number };
        Returns: undefined;
      };
      budget_clean_name: { Args: { p_name: string }; Returns: string };
      budget_pending_costs_to_notify: {
        Args: never;
        Returns: {
          amount: number;
          bucket_name: string;
          client_id: string;
          cost_id: string;
          description: string;
          organisation_id: string;
        }[];
      };
      budget_settle_pending: {
        Args: { p_bucket_id: string };
        Returns: undefined;
      };
      budget_threshold_state: {
        Args: {
          p_exhausted?: boolean;
          p_pending_count: number;
          p_percent: number;
        };
        Returns: string;
      };
      budget_thresholds_snapshot: {
        Args: never;
        Returns: {
          bucket_id: string;
          client_id: string;
          client_name: string;
          organisation_id: string;
          percent_used: number;
          period_start: string;
          threshold_state: string;
        }[];
      };
      budget_today: { Args: never; Returns: string };
      can_access_client_documents: {
        Args: { p_client_id: string };
        Returns: boolean;
      };
      can_edit_budget: { Args: { p_client_id: string }; Returns: boolean };
      can_edit_care_events: { Args: { p_client_id: string }; Returns: boolean };
      can_read_budget: { Args: { p_client_id: string }; Returns: boolean };
      can_read_care_events: { Args: { p_client_id: string }; Returns: boolean };
      can_upload_client_documents: {
        Args: { p_client_id: string };
        Returns: boolean;
      };
      carer_on_active_shift: { Args: { p_client_id: string }; Returns: boolean };
      charge_ended_event_occurrences: {
        Args: { p_client_id: string; p_items: Json };
        Returns: number;
      };
      client_shift_carers: {
        Args: { p_client_id: string; p_from: string; p_to: string };
        Returns: {
          carer_display_name: string;
          carer_id: string;
          ends_at: string;
          shift_id: string;
          starts_at: string;
        }[];
      };
      current_organisation_id: { Args: never; Returns: string };
      current_profile: {
        Args: never;
        Returns: {
          address: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_name: string | null;
          organisation_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      discard_unregistered_account: { Args: never; Returns: undefined };
      get_carer_shifts: {
        Args: { p_carer_id: string; p_from: string; p_to: string };
        Returns: {
          carer_id: string;
          client_first_name: string;
          client_id: string;
          client_last_name: string;
          ends_at: string;
          id: string;
          starts_at: string;
        }[];
      };
      is_admin_of_client: { Args: { p_client_id: string }; Returns: boolean };
      is_admin_of_organisation: {
        Args: { p_organisation_id: string };
        Returns: boolean;
      };
      is_assigned_carer: { Args: { p_client_id: string }; Returns: boolean };
      is_family_of: { Args: { p_client_id: string }; Returns: boolean };
      link_document_to_event: {
        Args: { p_document_id: string; p_event_id: string };
        Returns: undefined;
      };
      list_organisations_for_transfer: {
        Args: { p_client_id: string };
        Returns: {
          id: string;
          is_current: boolean;
          name: string;
        }[];
      };
      overlapping_shifts: {
        Args: { p_carer_id: string; p_ends_at: string; p_starts_at: string };
        Returns: {
          cancelled_at: string | null;
          carer_id: string;
          client_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string;
          id: string;
          organisation_id: string;
          starts_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "shifts";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      register_account: {
        Args: {
          p_client_first_name?: string;
          p_client_last_name?: string;
          p_first_name: string;
          p_last_name: string;
          p_organisation_name?: string;
          p_role: Database["public"]["Enums"]["app_role"];
        };
        Returns: Json;
      };
      remove_bucket: {
        Args: { p_bucket_id: string; p_note?: string };
        Returns: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string | null;
          name: string;
          removed_at: string | null;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "budget_buckets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      remove_funds: {
        Args: { p_amount: number; p_bucket_id: string; p_note?: string };
        Returns: {
          amount: number;
          bucket_id: string;
          client_id: string;
          created_at: string;
          description: string;
          entry_date: string;
          id: string;
          kind: string;
          note: string | null;
          recorded_by: string;
          recorded_by_name: string;
          seq: number;
        };
        SetofOptions: {
          from: "*";
          to: "budget_fund_entries";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      rename_bucket: {
        Args: { p_bucket_id: string; p_name: string };
        Returns: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string | null;
          name: string;
          removed_at: string | null;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "budget_buckets";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_budget_edit: {
        Args: {
          p_added: Json;
          p_buckets: Json;
          p_client_id: string;
          p_note?: string;
        };
        Returns: undefined;
      };
      session_is_aal2: { Args: never; Returns: boolean };
      set_event_cost: {
        Args: { p_bucket_id: string; p_cost: number; p_event_id: string };
        Returns: {
          bucket_id: string | null;
          client_id: string;
          completion_mode: string;
          cost: number | null;
          cost_set_at: string | null;
          created_at: string;
          created_by: string | null;
          deactivated_at: string | null;
          description: string;
          duration_minutes: number;
          id: string;
          is_active: boolean;
          recurrence: Json | null;
          recurrence_until: string | null;
          starts_at: string;
          title: string;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "care_events";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_occurrence_done: {
        Args: { p_event_id: string; p_original_start: string };
        Returns: {
          action: string;
          actor_display_name: string;
          actor_id: string;
          client_id: string;
          event_id: string;
          id: string;
          occurred_at: string;
          organisation_id: string | null;
          original_start: string;
          seq: number;
        };
        SetofOptions: {
          from: "*";
          to: "care_event_completions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_occurrence_undone: {
        Args: { p_event_id: string; p_original_start: string };
        Returns: {
          action: string;
          actor_display_name: string;
          actor_id: string;
          client_id: string;
          event_id: string;
          id: string;
          occurred_at: string;
          organisation_id: string | null;
          original_start: string;
          seq: number;
        };
        SetofOptions: {
          from: "*";
          to: "care_event_completions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      transfer_client_organisation: {
        Args: { p_client_id: string; p_new_org_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "family" | "carer" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["family", "carer", "admin"],
    },
  },
} as const;
