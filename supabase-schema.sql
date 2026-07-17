-- ============================================================
-- WhatsApp Chat Comparer — Supabase Schema
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Projects ─────────────────────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_at  timestamptz default now()
);

-- ─── Chats ────────────────────────────────────────────────────────────────────
create table if not exists chats (
  id                    uuid primary key default uuid_generate_v4(),
  project_id            uuid not null references projects(id) on delete cascade,
  contact_name          text not null,
  vendor_phone_number   text default '',
  status                text default 'None' check (status in ('None','Opsi 1','Opsi 2','Ga Jadi','Mahal Brow')),
  internal_notes        text default '',
  last_message_at       timestamptz default now(),
  last_message_snippet  text default '',
  created_at            timestamptz default now()
);

create index if not exists chats_project_id_idx on chats(project_id);
create index if not exists chats_last_message_at_idx on chats(last_message_at desc);

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table if not exists messages (
  id                uuid primary key default uuid_generate_v4(),
  chat_id           uuid not null references chats(id) on delete cascade,
  sender_name       text not null,
  timestamp         timestamptz not null,
  text              text default '',
  has_attachment    boolean default false,
  attachment_url    text,
  is_system_message boolean default false,
  is_dummy_reply    boolean default false
);

create index if not exists messages_chat_id_idx on messages(chat_id);
create index if not exists messages_timestamp_idx on messages(timestamp asc);
create index if not exists messages_chat_ts_idx on messages(chat_id, timestamp desc);

-- ─── Row Level Security (Public access — no auth in V1) ───────────────────────
alter table projects enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;

-- Allow all operations for anon (since there's no login in V1)
create policy "Public read projects" on projects for select using (true);
create policy "Public insert projects" on projects for insert with check (true);
create policy "Public update projects" on projects for update using (true);
create policy "Public delete projects" on projects for delete using (true);

create policy "Public read chats" on chats for select using (true);
create policy "Public insert chats" on chats for insert with check (true);
create policy "Public update chats" on chats for update using (true);
create policy "Public delete chats" on chats for delete using (true);

create policy "Public read messages" on messages for select using (true);
create policy "Public insert messages" on messages for insert with check (true);
create policy "Public update messages" on messages for update using (true);
create policy "Public delete messages" on messages for delete using (true);

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Run these in Supabase Dashboard > Storage > New Bucket:
--   Name: media
--   Public: true
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public media read" on storage.objects for select using (bucket_id = 'media');
create policy "Public media insert" on storage.objects for insert with check (bucket_id = 'media');
create policy "Public media update" on storage.objects for update using (bucket_id = 'media');
create policy "Public media delete" on storage.objects for delete using (bucket_id = 'media');
