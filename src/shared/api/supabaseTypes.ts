export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          date: string;
          family_id: string | null;
          id: string;
          receipt_items: Json | null;
          store_id: string;
          title: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          date: string;
          family_id?: string | null;
          id?: string;
          receipt_items?: Json | null;
          store_id: string;
          title?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          date?: string;
          family_id?: string | null;
          id?: string;
          receipt_items?: Json | null;
          store_id?: string;
          title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      families: {
        Row: {
          budget_goals: string[];
          created_at: string;
          dietary_preferences: string[];
          id: string;
          member_ids: string[];
          monthly_budget: number;
          updated_at: string;
        };
        Insert: {
          budget_goals?: string[];
          created_at?: string;
          dietary_preferences?: string[];
          id: string;
          member_ids?: string[];
          monthly_budget?: number;
          updated_at?: string;
        };
        Update: {
          budget_goals?: string[];
          created_at?: string;
          dietary_preferences?: string[];
          id?: string;
          member_ids?: string[];
          monthly_budget?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar: string;
          avatar_color: string;
          created_at: string;
          email: string;
          family_id: string | null;
          id: string;
          is_onboarded: boolean;
          last_login_at: string;
          name: string;
          profile: Json;
        };
        Insert: {
          avatar?: string;
          avatar_color?: string;
          created_at?: string;
          email: string;
          family_id?: string | null;
          id: string;
          is_onboarded?: boolean;
          last_login_at?: string;
          name: string;
          profile?: Json;
        };
        Update: {
          avatar?: string;
          avatar_color?: string;
          created_at?: string;
          email?: string;
          family_id?: string | null;
          id?: string;
          is_onboarded?: boolean;
          last_login_at?: string;
          name?: string;
          profile?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "users_family_id_fkey";
            columns: ["family_id"];
            isOneToOne: false;
            referencedRelation: "families";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
