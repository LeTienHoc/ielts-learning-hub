export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          duration_seconds: number | null
          id: number
          metadata: NonNullable<Json>
          module: string
          occurred_at: string
          ref_id: string | null
          ref_type: string | null
          type: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          duration_seconds?: number | null
          id?: never
          metadata?: NonNullable<Json>
          module: string
          occurred_at?: string
          ref_id?: string | null
          ref_type?: string | null
          type: string
          user_id?: string
        }
        Update: {
          duration_seconds?: number | null
          id?: never
          metadata?: NonNullable<Json>
          module?: string
          occurred_at?: string
          ref_id?: string | null
          ref_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      attempt_answers: {
        Row: {
          attempt_id: string
          checked_at: string | null
          is_correct: boolean | null
          points: number | null
          question_id: string
          response: NonNullable<Json>
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          attempt_id: string
          checked_at?: string | null
          is_correct?: boolean | null
          points?: number | null
          question_id: string
          response?: NonNullable<Json>
          updated_at?: string
        }
        Update: {
          attempt_id?: string
          checked_at?: string | null
          is_correct?: boolean | null
          points?: number | null
          question_id?: string
          response?: NonNullable<Json>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          content_version: number
          deadline_at: string | null
          id: string
          max_score: number | null
          mode: string
          practice_set_id: string
          score: number | null
          started_at: string
          status: string
          submit_reason: string | null
          submitted_at: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          content_version: number
          deadline_at?: string | null
          id?: string
          max_score?: number | null
          mode: string
          practice_set_id: string
          score?: number | null
          started_at?: string
          status?: string
          submit_reason?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          content_version?: number
          deadline_at?: string | null
          id?: string
          max_score?: number | null
          mode?: string
          practice_set_id?: string
          score?: number | null
          started_at?: string
          status?: string
          submit_reason?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "practice_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          created_at: string
          id: string
          level: string
          review_status: string
          slug: string
          source: string
          summary: string | null
          title: string
          topics: string[]
          type: string
          updated_at: string
          version: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id: string
          level: string
          review_status?: string
          slug: string
          source: string
          summary?: string | null
          title: string
          topics?: string[]
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          review_status?: string
          slug?: string
          source?: string
          summary?: string | null
          title?: string
          topics?: string[]
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      grammar_topics: {
        Row: {
          id: string
          lesson: NonNullable<Json>
          position: number
          practice_set_id: string | null
        }
        ComputedFields: never
        Insert: {
          id: string
          lesson: NonNullable<Json>
          position: number
          practice_set_id?: string | null
        }
        Update: {
          id?: string
          lesson?: NonNullable<Json>
          position?: number
          practice_set_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grammar_topics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_topics_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "practice_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sets: {
        Row: {
          id: string
          module: string
          passage_text: string | null
          passage_title: string | null
          test_time_limit_seconds: number | null
        }
        ComputedFields: never
        Insert: {
          id: string
          module: string
          passage_text?: string | null
          passage_title?: string | null
          test_time_limit_seconds?: number | null
        }
        Update: {
          id?: string
          module?: string
          passage_text?: string | null
          passage_title?: string | null
          test_time_limit_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sets_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_new_words: number
          display_name: string | null
          explanation_language: string
          id: string
          onboarding_status: string
          timezone: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          daily_new_words?: number
          display_name?: string | null
          explanation_language?: string
          id: string
          onboarding_status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_new_words?: number
          display_name?: string | null
          explanation_language?: string
          id?: string
          onboarding_status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_groups: {
        Row: {
          id: string
          instructions: string
          options: Json | null
          position: number
          practice_set_id: string
          question_type: string
        }
        ComputedFields: never
        Insert: {
          id: string
          instructions: string
          options?: Json | null
          position: number
          practice_set_id: string
          question_type: string
        }
        Update: {
          id?: string
          instructions?: string
          options?: Json | null
          position?: number
          practice_set_id?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_groups_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "practice_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      question_keys: {
        Row: {
          accepted: NonNullable<Json>
          correction: string | null
          evidence_end: number | null
          evidence_start: number | null
          explanation: string
          explanation_vi: string | null
          question_id: string
        }
        ComputedFields: never
        Insert: {
          accepted: NonNullable<Json>
          correction?: string | null
          evidence_end?: number | null
          evidence_start?: number | null
          explanation: string
          explanation_vi?: string | null
          question_id: string
        }
        Update: {
          accepted?: NonNullable<Json>
          correction?: string | null
          evidence_end?: number | null
          evidence_start?: number | null
          explanation?: string
          explanation_vi?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          group_id: string
          id: string
          max_words: number | null
          number: number
          options: Json | null
          position: number
          practice_set_id: string
          prompt: string
          response_kind: string
          select_count: number | null
        }
        ComputedFields: never
        Insert: {
          group_id: string
          id: string
          max_words?: number | null
          number: number
          options?: Json | null
          position: number
          practice_set_id: string
          prompt: string
          response_kind: string
          select_count?: number | null
        }
        Update: {
          group_id?: string
          id?: string
          max_words?: number | null
          number?: number
          options?: Json | null
          position?: number
          practice_set_id?: string
          prompt?: string
          response_kind?: string
          select_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "question_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_practice_set_id_fkey"
            columns: ["practice_set_id"]
            isOneToOne: false
            referencedRelation: "practice_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      review_logs: {
        Row: {
          exercise: string
          grade: string
          id: number
          interval_after: number
          interval_before: number
          reviewed_at: string
          user_id: string
          word_id: string
        }
        ComputedFields: never
        Insert: {
          exercise: string
          grade: string
          id?: never
          interval_after: number
          interval_before: number
          reviewed_at?: string
          user_id: string
          word_id: string
        }
        Update: {
          exercise?: string
          grade?: string
          id?: never
          interval_after?: number
          interval_before?: number
          reviewed_at?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      user_words: {
        Row: {
          added_at: string
          due_at: string | null
          ease: number
          interval_days: number
          introduced_at: string | null
          lapses: number
          queue_order: number
          repetitions: number
          review_count: number
          status: string
          user_id: string
          word_id: string
        }
        ComputedFields: never
        Insert: {
          added_at?: string
          due_at?: string | null
          ease?: number
          interval_days?: number
          introduced_at?: string | null
          lapses?: number
          queue_order?: never
          repetitions?: number
          review_count?: number
          status?: string
          user_id: string
          word_id: string
        }
        Update: {
          added_at?: string
          due_at?: string | null
          ease?: number
          interval_days?: number
          introduced_at?: string | null
          lapses?: number
          queue_order?: never
          repetitions?: number
          review_count?: number
          status?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_set_words: {
        Row: {
          position: number
          set_id: string
          word_id: string
        }
        ComputedFields: never
        Insert: {
          position: number
          set_id: string
          word_id: string
        }
        Update: {
          position?: number
          set_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_set_words_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_set_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_sets: {
        Row: {
          id: string
        }
        ComputedFields: never
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_sets_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          collocations: NonNullable<Json>
          common_mistakes: NonNullable<Json>
          examples: NonNullable<Json>
          id: string
          ipa: string | null
          lemma: string
          level: string
          meaning_en: string
          meaning_vi: string
          part_of_speech: string
          slug: string
          topics: string[]
        }
        ComputedFields: never
        Insert: {
          collocations?: NonNullable<Json>
          common_mistakes?: NonNullable<Json>
          examples?: NonNullable<Json>
          id: string
          ipa?: string | null
          lemma: string
          level: string
          meaning_en: string
          meaning_vi: string
          part_of_speech: string
          slug: string
          topics?: string[]
        }
        Update: {
          collocations?: NonNullable<Json>
          common_mistakes?: NonNullable<Json>
          examples?: NonNullable<Json>
          id?: string
          ipa?: string | null
          lemma?: string
          level?: string
          meaning_en?: string
          meaning_vi?: string
          part_of_speech?: string
          slug?: string
          topics?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_set_to_my_words: { Args: { target_set_id: string }; Returns: number }
      add_word_to_my_words: { Args: { target_word_id: string }; Returns: boolean }
      check_answer: {
        Args: { answer: Json; target_attempt_id: string; target_question_id: string }
        Returns: {
          accepted: Json
          correction: string
          explanation: string
          explanation_vi: string
          is_correct: boolean
          points: number
        }[]
      }
      delete_current_user: { Args: Record<PropertyKey, never>; Returns: undefined }
      finalize_attempt: { Args: { reason: string; target_attempt_id: string }; Returns: undefined }
      finish_review_session: { Args: { session_started_at: string }; Returns: undefined }
      get_attempt_review: {
        Args: { target_attempt_id: string }
        Returns: {
          accepted: Json
          correction: string
          evidence_end: number
          evidence_start: number
          explanation: string
          explanation_vi: string
          question_id: string
        }[]
      }
      introduce_new_words: { Args: Record<PropertyKey, never>; Returns: string[] }
      is_published_content: { Args: { item_id: string }; Returns: boolean }
      is_published_practice_set: { Args: { set_id: string }; Returns: boolean }
      is_published_word: { Args: { target_word_id: string }; Returns: boolean }
      new_word_allowance: { Args: { at: string; target_user_id: string }; Returns: number }
      normalize_text_answer: { Args: { value: string }; Returns: string }
      review_days_in_week: { Args: { at: string; target_user_id: string }; Returns: number }
      review_word: {
        Args: {
          exercise: string
          expected_review_count: number
          grade: string
          target_word_id: string
        }
        Returns: string
      }
      save_answer: {
        Args: { answer: Json; target_attempt_id: string; target_question_id: string }
        Returns: undefined
      }
      score_answer: { Args: { answer: Json; target_question_id: string }; Returns: number }
      start_attempt: { Args: { attempt_mode: string; target_set_id: string }; Returns: string }
      submit_attempt: { Args: { target_attempt_id: string }; Returns: undefined }
      weekly_review_days: { Args: Record<PropertyKey, never>; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
