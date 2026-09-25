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
          client_id: string;
          completion_mode: string;
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
          client_id: string;
          completion_mode?: string;
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
          client_id?: string;
          completion_mode?: string;
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

      carer_client_assignments: {
        Row: {
          carer_id: string;
          client_id: string;
          ended_at: string | null;
          id: string;
          organisation_id: string;
          started_at: string;
        };
        Insert: {
          carer_id: string;
          client_id: string;
          ended_at?: string | null;
          id?: string;
          organisation_id: string;
          started_at?: string;
        };
        Update: {
          carer_id?: string;
          client_id?: string;
          ended_at?: string | null;
          id?: string;
          organisation_id?: string;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carer_client_assignments_carer_id_fkey";
            columns: ["carer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carer_client_assignments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "carer_client_assignments_organisation_id_fkey";
            columns: ["organisation_id"];
            isOneToOne: false;
            referencedRelation: "organisations";
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

      test: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      current_organisation_id: {
        Args: never;
        Returns: string;
      };

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

      is_admin_of_client: {
        Args: {
          p_client_id: string;
        };
        Returns: boolean;
      };

      is_assigned_carer: {
        Args: {
          p_client_id: string;
        };
        Returns: boolean;
      };

      is_family_of: {
        Args: {
          p_client_id: string;
        };
        Returns: boolean;
      };

      can_edit_care_events: {
        Args: {
          p_client_id: string;
        };
        Returns: boolean;
      };

      can_read_care_events: {
        Args: {
          p_client_id: string;
        };
        Returns: boolean;
      };

      client_shift_carers: {
        Args: {
          p_client_id: string;
          p_from: string;
          p_to: string;
        };
        Returns: {
          shift_id: string;
          carer_id: string;
          carer_display_name: string;
          starts_at: string;
          ends_at: string;
        }[];
      };

      set_occurrence_done: {
        Args: {
          p_event_id: string;
          p_original_start: string;
        };
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
      };

      set_occurrence_undone: {
        Args: {
          p_event_id: string;
          p_original_start: string;
        };
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
