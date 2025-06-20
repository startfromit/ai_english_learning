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
      increment_play_count: {
        Args: {
          p_user_id: string
          p_usage_date: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
