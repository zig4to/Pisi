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
      pisi_kesiii_households: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          join_code: string;
          created_at: string;
        };
        Insert: never;
        Update: {
          name?: string;
        };
      };
      pisi_kesiii_members: {
        Relationships: [];
        Row: {
          household_id: string;
          user_id: string;
          display_name: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string;
        };
      };
      pisi_kesiii_locations: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          parent_id: string | null;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          parent_id?: string | null;
          name: string;
        };
        Update: {
          parent_id?: string | null;
          name?: string;
        };
      };
      pisi_kesiii_items: {
        Relationships: [];
        Row: {
          id: string;
          household_id: string;
          name: string;
          note: string;
          location_id: string | null;
          location_detail: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          note?: string;
          location_id?: string | null;
          location_detail?: string;
        };
        Update: {
          name?: string;
          note?: string;
          location_id?: string | null;
          location_detail?: string;
        };
      };
      pisi_kesiii_item_moves: {
        Relationships: [];
        Row: {
          id: string;
          item_id: string;
          household_id: string;
          from_path: string | null;
          from_detail: string;
          to_path: string | null;
          to_detail: string;
          moved_by: string | null;
          moved_at: string;
        };
        Insert: never;
        Update: never;
      };
      pisi_nabava_categories: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          position?: number;
        };
        Update: {
          name?: string;
          position?: number;
        };
      };
      pisi_nabava_items: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          name: string;
          store: string;
          url: string;
          priority: "urgent" | "normal";
          bought_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          name: string;
          store?: string;
          url?: string;
          priority?: "urgent" | "normal";
          bought_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          store?: string;
          url?: string;
          priority?: "urgent" | "normal";
          bought_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      pisi_kesiii_ensure_household: {
        Args: Record<string, never>;
        Returns: string;
      };
      pisi_kesiii_join: {
        Args: { code: string };
        Returns: string | null;
      };
      pisi_kesiii_leave: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      pisi_kesiii_new_code: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
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

type KesiiiTables = Database["public"]["Tables"];
export type KesiiiHousehold = KesiiiTables["pisi_kesiii_households"]["Row"];
export type KesiiiMember = KesiiiTables["pisi_kesiii_members"]["Row"];
export type KesiiiLocation = KesiiiTables["pisi_kesiii_locations"]["Row"];
export type KesiiiItem = KesiiiTables["pisi_kesiii_items"]["Row"];
export type KesiiiMove = KesiiiTables["pisi_kesiii_item_moves"]["Row"];

export type NabavaCategory = Database["public"]["Tables"]["pisi_nabava_categories"]["Row"];
export type NabavaItem = Database["public"]["Tables"]["pisi_nabava_items"]["Row"];

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
