// src/lib/database.types.ts
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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          updated_at?: string
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string | null
          exercise_type: string
          goal_type: string
          goal_value: number
          start_date: string
          end_date: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          exercise_type: string
          goal_type: string
          goal_value: number
          start_date: string
          end_date: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          exercise_type?: string
          goal_type?: string
          goal_value?: number
          start_date?: string
          end_date?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          challenge_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          challenge_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      exercise_logs: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          exercise_count: number
          log_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          challenge_id: string
          exercise_count: number
          log_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          challenge_id?: string
          exercise_count?: number
          log_date?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_current_streak: {
        Args: {
          p_user_id: string
          p_challenge_id: string
        }
        Returns: number
      }
    }
  }
}