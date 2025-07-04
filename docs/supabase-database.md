-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tags ARRAY DEFAULT '{}'::text[],
  folder_id uuid,
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.collection_bookmarks (
  collection_id uuid NOT NULL,
  bookmark_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT collection_bookmarks_pkey PRIMARY KEY (collection_id, bookmark_id),
  CONSTRAINT collection_bookmarks_bookmark_id_fkey FOREIGN KEY (bookmark_id) REFERENCES public.bookmarks(id),
  CONSTRAINT collection_bookmarks_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(id)
);
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  cover_image text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_public boolean NOT NULL DEFAULT false,
  CONSTRAINT collections_pkey PRIMARY KEY (id),
  CONSTRAINT collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.folder_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  folder_id uuid NOT NULL,
  user_id uuid NOT NULL,
  permission_level text NOT NULL CHECK (permission_level = ANY (ARRAY['viewer'::text, 'editor'::text, 'owner'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT folder_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT folder_permissions_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT folder_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  parent_folder_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.folders(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  nickname text UNIQUE,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);