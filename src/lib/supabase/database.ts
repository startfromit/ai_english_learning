export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          provider: string | null
          email_verified: boolean | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          name?: string | null
          provider?: string | null
          email_verified?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          provider?: string | null
          email_verified?: boolean | null
        }
      }
      user_usage: {
        Row: {
          user_id: string
          play_count: number
          usage_date: string
          updated_at: string
        }
        Insert: {
          user_id: string
          play_count?: number
          usage_date: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          play_count?: number
          usage_date?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
