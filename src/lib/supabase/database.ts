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
          id: string
          daily_play_count: number
          last_play_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          daily_play_count?: number
          last_play_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          daily_play_count?: number
          last_play_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_vocabulary: {
        Row: {
          id: number
          user_id: string
          created_at: string
          word: string
          meaning_en: string | null
          meaning_zh: string | null
          example: string | null
        }
        Insert: {
          id?: number
          user_id: string
          created_at?: string
          word: string
          meaning_en?: string | null
          meaning_zh?: string | null
          example?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          created_at?: string
          word?: string
          meaning_en?: string | null
          meaning_zh?: string | null
          example?: string | null
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
