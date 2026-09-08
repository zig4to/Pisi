// Ročno napisani tipi, ki ustrezajo supabase/migrations/0001_init.sql.
// Če imaš nameščen Supabase CLI, jih lahko kasneje nadomestiš z generiranimi:
//   supabase gen types typescript --project-id <id> > src/lib/types/database.types.ts

// Tiptap dokument (JSON). Ohlapno tipiziran; hranimo ga kot jsonb.
export type TiptapDoc = {
  type: "doc";
  content?: unknown[];
};

export type Database = {
  public: {
    Tables: {
      pisi_notebooks: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          title: string;
          color: string;
          is_pinned: boolean;
          position: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          color?: string;
          is_pinned?: boolean;
          position?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          color?: string;
          is_pinned?: boolean;
          position?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pisi_sections: {
        Relationships: [
          {
            foreignKeyName: "pisi_sections_notebook_id_fkey";
            columns: ["notebook_id"];
            isOneToOne: false;
            referencedRelation: "pisi_notebooks";
            referencedColumns: ["id"];
          }
        ];
        Row: {
          id: string;
          user_id: string;
          notebook_id: string;
          title: string;
          color: string;
          is_pinned: boolean;
          position: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          notebook_id: string;
          title: string;
          color?: string;
          is_pinned?: boolean;
          position?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notebook_id?: string;
          title?: string;
          color?: string;
          is_pinned?: boolean;
          position?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pisi_pages: {
        Relationships: [
          {
            foreignKeyName: "pisi_pages_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "pisi_sections";
            referencedColumns: ["id"];
          }
        ];
        Row: {
          id: string;
          user_id: string;
          section_id: string;
          title: string;
          content: TiptapDoc;
          content_text: string;
          is_pinned: boolean;
          position: number;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          section_id: string;
          title?: string;
          content?: TiptapDoc;
          content_text?: string;
          is_pinned?: boolean;
          position?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          section_id?: string;
          title?: string;
          content?: TiptapDoc;
          content_text?: string;
          is_pinned?: boolean;
          position?: number;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pisi_tags: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      pisi_page_tags: {
        Relationships: [
          {
            foreignKeyName: "pisi_page_tags_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pisi_pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pisi_page_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "pisi_tags";
            referencedColumns: ["id"];
          }
        ];
        Row: {
          page_id: string;
          tag_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          page_id: string;
          tag_id: string;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          page_id?: string;
          tag_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      pisi_vzlet_tasks: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          title: string;
          for_date: string;
          done: boolean;
          done_at: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          for_date: string;
          done?: boolean;
          done_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          for_date?: string;
          done?: boolean;
          done_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Notebook = Database["public"]["Tables"]["pisi_notebooks"]["Row"];
export type NotebookInsert =
  Database["public"]["Tables"]["pisi_notebooks"]["Insert"];
export type NotebookUpdate =
  Database["public"]["Tables"]["pisi_notebooks"]["Update"];

export type Section = Database["public"]["Tables"]["pisi_sections"]["Row"];
export type SectionInsert =
  Database["public"]["Tables"]["pisi_sections"]["Insert"];
export type SectionUpdate =
  Database["public"]["Tables"]["pisi_sections"]["Update"];

export type Page = Database["public"]["Tables"]["pisi_pages"]["Row"];
export type PageInsert = Database["public"]["Tables"]["pisi_pages"]["Insert"];
export type PageUpdate = Database["public"]["Tables"]["pisi_pages"]["Update"];

export type Tag = Database["public"]["Tables"]["pisi_tags"]["Row"];
export type TagInsert = Database["public"]["Tables"]["pisi_tags"]["Insert"];
export type TagUpdate = Database["public"]["Tables"]["pisi_tags"]["Update"];

export type VzletTask = Database["public"]["Tables"]["pisi_vzlet_tasks"]["Row"];
export type VzletTaskInsert =
  Database["public"]["Tables"]["pisi_vzlet_tasks"]["Insert"];
export type VzletTaskUpdate =
  Database["public"]["Tables"]["pisi_vzlet_tasks"]["Update"];

// ===== Kompoziti za UI =====

export type NotebookWithSections = Notebook & {
  sections: Section[];
};

export type PageListItem = Pick<
  Page,
  "id" | "title" | "is_pinned" | "position" | "updated_at"
>;

export type PageWithTags = Page & {
  tags: Tag[];
};

export type SearchResult = {
  page_id: string;
  title: string;
  snippet: string;
  section_id: string;
  section_title: string;
  notebook_id: string;
  notebook_title: string;
  updated_at: string;
};

export type TrashKind = "notebook" | "section" | "page";

export type TrashItem = {
  kind: TrashKind;
  id: string;
  title: string;
  deleted_at: string;
  // pot za kontekst (npr. "Beležka › Sekcija")
  context: string | null;
};
