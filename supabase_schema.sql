-- ============================================================
-- UniHive — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  username text unique,
  phone text,
  avatar_url text,
  college text check (college in ('"'"'SSN'"'"', '"'"'SNUC'"'"')),
  reputation_score integer default 0,
  profile_complete boolean default false,
  created_at timestamp with time zone default now()
);

-- Posts table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text check (type in ('"'"'lost'"'"', '"'"'found'"'"', '"'"'request'"'"', '"'"'offer'"'"')) not null,
  category text not null,
  title text not null,
  description text not null,
  location text,
  images text[] default '"'"'{}'"'"',
  status text check (status in ('"'"'active'"'"', '"'"'claimed'"'"', '"'"'resolved'"'"')) default '"'"'active'"'"',
  duration_days integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Interests table
create table public.interests (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  from_user_id uuid references public.users(id) on delete cascade not null,
  status text check (status in ('"'"'pending'"'"', '"'"'accepted'"'"', '"'"'rejected'"'"')) default '"'"'pending'"'"',
  created_at timestamp with time zone default now(),
  unique(post_id, from_user_id)
);

-- Conversations table
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_a_id uuid references public.users(id) on delete cascade not null,
  user_b_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(post_id, user_a_id, user_b_id)
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Ratings table
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  rater_id uuid references public.users(id) on delete cascade not null,
  rated_user_id uuid references public.users(id) on delete cascade not null,
  score integer check (score between 1 and 5) not null,
  comment text,
  created_at timestamp with time zone default now(),
  unique(post_id, rater_id)
);

-- Row Level Security
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.interests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;

-- RLS Policies: Users
create policy "Users can read all profiles" on public.users
  for select using (auth.role() = '"'"'authenticated'"'"');
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- RLS Policies: Posts
create policy "Anyone can read active posts" on public.posts
  for select using (auth.role() = '"'"'authenticated'"'"');
create policy "Users can insert own posts" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = user_id);

-- RLS Policies: Interests
create policy "Users can read relevant interests" on public.interests
  for select using (
    auth.uid() = from_user_id or
    auth.uid() = (select user_id from public.posts where id = post_id)
  );
create policy "Users can create interests" on public.interests
  for insert with check (auth.uid() = from_user_id);
create policy "Post owners can update interest status" on public.interests
  for update using (
    auth.uid() = (select user_id from public.posts where id = post_id)
  );

-- RLS Policies: Conversations
create policy "Participants can read conversations" on public.conversations
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "Users can create conversations" on public.conversations
  for insert with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- RLS Policies: Messages
create policy "Participants can read messages" on public.messages
  for select using (
    auth.uid() in (
      select user_a_id from public.conversations where id = conversation_id
      union
      select user_b_id from public.conversations where id = conversation_id
    )
  );
create policy "Participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    auth.uid() in (
      select user_a_id from public.conversations where id = conversation_id
      union
      select user_b_id from public.conversations where id = conversation_id
    )
  );

-- RLS Policies: Ratings
create policy "Anyone can read ratings" on public.ratings
  for select using (auth.role() = '"'"'authenticated'"'"');
create policy "Users can create own ratings" on public.ratings
  for insert with check (auth.uid() = rater_id);

-- Trigger: auto-create user profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- MODULE 2 ADDITION: Avatar Storage Bucket
-- Run this SEPARATELY in Supabase SQL Editor after the schema
-- ============================================================

-- Create public avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  ''avatars'',
  ''avatars'',
  true,
  2097152,   -- 2 MB limit enforced at DB level
  array[''image/jpeg'', ''image/png'', ''image/webp'', ''image/gif'']
)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload to their own folder
create policy "Users can upload own avatar" on storage.objects
  for insert with check (
    bucket_id = ''avatars'' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar" on storage.objects
  for update using (
    bucket_id = ''avatars'' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
create policy "Anyone can view avatars" on storage.objects
  for select using (bucket_id = ''avatars'');
