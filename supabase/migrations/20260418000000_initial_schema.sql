-- ============================================================================
-- Travel Itinerary Creator — initial schema
-- ============================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- profiles
-- ============================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    display_name text,
    avatar_url text,
    home_city text,
    saved_places_count int not null default 0,
    trips_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles(username);

-- ============================================================================
-- source_videos — metadata from TikTok (no raw video retained)
-- ============================================================================
create table if not exists public.source_videos (
    id uuid primary key default uuid_generate_v4(),
    source_url text not null,
    source_platform text not null default 'tiktok',
    external_id text,
    author text,
    title text,
    description text,
    duration_seconds int,
    thumbnail_url text,
    raw_captions text,
    raw_transcript text,
    raw_hashtags text[],
    created_at timestamptz not null default now(),
    unique(source_platform, external_id)
);

create index if not exists source_videos_source_url_idx on public.source_videos(source_url);

-- ============================================================================
-- ingestion_jobs — async pipeline state
-- ============================================================================
create type ingestion_status as enum ('queued', 'processing', 'completed', 'failed');

create table if not exists public.ingestion_jobs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_url text not null,
    source_video_id uuid references public.source_videos(id) on delete set null,
    status ingestion_status not null default 'queued',
    error_message text,
    attempts int not null default 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists ingestion_jobs_user_id_idx on public.ingestion_jobs(user_id);
create index if not exists ingestion_jobs_status_idx on public.ingestion_jobs(status);

-- ============================================================================
-- extracted_places — raw AI extraction output awaiting confirmation
-- ============================================================================
create table if not exists public.extracted_places (
    id uuid primary key default uuid_generate_v4(),
    ingestion_job_id uuid not null references public.ingestion_jobs(id) on delete cascade,
    original_name text not null,
    normalized_name text,
    city text,
    region text,
    country text,
    category text,
    reason text,
    confidence numeric(3,2) not null default 0.0,
    latitude double precision,
    longitude double precision,
    address text,
    thumbnail_url text,
    geocoding_candidates jsonb,
    confirmed boolean not null default false,
    rejected boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists extracted_places_job_idx on public.extracted_places(ingestion_job_id);

-- ============================================================================
-- saved_places — user-confirmed travel spots
-- ============================================================================
create table if not exists public.saved_places (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    source_url text,
    source_platform text default 'tiktok',
    source_video_id uuid references public.source_videos(id) on delete set null,
    original_name text,
    normalized_name text not null,
    category text,
    latitude double precision,
    longitude double precision,
    address text,
    city text,
    region text,
    country text,
    confidence numeric(3,2),
    notes text,
    thumbnail_url text,
    tags text[] not null default '{}',
    created_at timestamptz not null default now(),
    -- Prevent duplicate saves of the same place from the same source
    unique(user_id, source_url, normalized_name)
);

create index if not exists saved_places_user_idx on public.saved_places(user_id);
create index if not exists saved_places_tags_idx on public.saved_places using gin(tags);

-- ============================================================================
-- trips
-- ============================================================================
create table if not exists public.trips (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    destination text,
    start_date date not null,
    end_date date not null,
    budget text,
    vibe text,
    cover_image_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (end_date >= start_date)
);

create index if not exists trips_user_idx on public.trips(user_id);

-- ============================================================================
-- trip_days
-- ============================================================================
create table if not exists public.trip_days (
    id uuid primary key default uuid_generate_v4(),
    trip_id uuid not null references public.trips(id) on delete cascade,
    day_number int not null,
    day_date date not null,
    summary text,
    created_at timestamptz not null default now(),
    unique(trip_id, day_number)
);

create index if not exists trip_days_trip_idx on public.trip_days(trip_id);

-- ============================================================================
-- itinerary_items
-- ============================================================================
create type item_block as enum ('morning', 'afternoon', 'evening');

create table if not exists public.itinerary_items (
    id uuid primary key default uuid_generate_v4(),
    trip_day_id uuid not null references public.trip_days(id) on delete cascade,
    saved_place_id uuid references public.saved_places(id) on delete set null,
    block item_block not null,
    position int not null default 0,
    title text not null,
    notes text,
    rationale text,
    estimated_travel_minutes int,
    created_at timestamptz not null default now()
);

create index if not exists itinerary_items_day_idx on public.itinerary_items(trip_day_id);

-- ============================================================================
-- shared_trip_invites (optional, for stretch social feature)
-- ============================================================================
create table if not exists public.shared_trip_invites (
    id uuid primary key default uuid_generate_v4(),
    trip_id uuid not null references public.trips(id) on delete cascade,
    token text unique not null default replace(gen_random_uuid()::text, '-', ''),
    created_by uuid not null references auth.users(id) on delete cascade,
    can_edit boolean not null default false,
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists shared_trip_invites_token_idx on public.shared_trip_invites(token);

-- ============================================================================
-- Profile counter maintenance
-- ============================================================================
create or replace function public.bump_profile_counts()
returns trigger language plpgsql security definer as $$
begin
    if tg_table_name = 'saved_places' then
        if tg_op = 'INSERT' then
            update public.profiles set saved_places_count = saved_places_count + 1 where id = new.user_id;
        elsif tg_op = 'DELETE' then
            update public.profiles set saved_places_count = greatest(saved_places_count - 1, 0) where id = old.user_id;
        end if;
    elsif tg_table_name = 'trips' then
        if tg_op = 'INSERT' then
            update public.profiles set trips_count = trips_count + 1 where id = new.user_id;
        elsif tg_op = 'DELETE' then
            update public.profiles set trips_count = greatest(trips_count - 1, 0) where id = old.user_id;
        end if;
    end if;
    return coalesce(new, old);
end $$;

drop trigger if exists saved_places_count_trigger on public.saved_places;
create trigger saved_places_count_trigger
    after insert or delete on public.saved_places
    for each row execute function public.bump_profile_counts();

drop trigger if exists trips_count_trigger on public.trips;
create trigger trips_count_trigger
    after insert or delete on public.trips
    for each row execute function public.bump_profile_counts();

-- ============================================================================
-- Auto-create profile on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
    insert into public.profiles (id, display_name, username)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
    )
    on conflict (id) do nothing;
    return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================================
-- updated_at touch helper
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
    for each row execute function public.touch_updated_at();

drop trigger if exists ingestion_jobs_touch on public.ingestion_jobs;
create trigger ingestion_jobs_touch before update on public.ingestion_jobs
    for each row execute function public.touch_updated_at();

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
    for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row-level security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.ingestion_jobs enable row level security;
alter table public.extracted_places enable row level security;
alter table public.saved_places enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.shared_trip_invites enable row level security;

-- profiles: anyone can read (for future social features), owner can update
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- ingestion_jobs: owner-only
drop policy if exists ingestion_jobs_owner on public.ingestion_jobs;
create policy ingestion_jobs_owner on public.ingestion_jobs for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- extracted_places: readable/writable via parent job ownership
drop policy if exists extracted_places_owner on public.extracted_places;
create policy extracted_places_owner on public.extracted_places for all
    using (exists (
        select 1 from public.ingestion_jobs j
        where j.id = ingestion_job_id and j.user_id = auth.uid()
    ));

-- saved_places: owner-only
drop policy if exists saved_places_owner on public.saved_places;
create policy saved_places_owner on public.saved_places for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trips: owner-only (shared read handled via invites separately)
drop policy if exists trips_owner on public.trips;
create policy trips_owner on public.trips for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trip_days: via trip ownership
drop policy if exists trip_days_owner on public.trip_days;
create policy trip_days_owner on public.trip_days for all
    using (exists (
        select 1 from public.trips t where t.id = trip_id and t.user_id = auth.uid()
    ));

-- itinerary_items: via trip ownership
drop policy if exists itinerary_items_owner on public.itinerary_items;
create policy itinerary_items_owner on public.itinerary_items for all
    using (exists (
        select 1 from public.trip_days d
        join public.trips t on t.id = d.trip_id
        where d.id = trip_day_id and t.user_id = auth.uid()
    ));

-- shared_trip_invites: creator manages
drop policy if exists shared_trip_invites_owner on public.shared_trip_invites;
create policy shared_trip_invites_owner on public.shared_trip_invites for all
    using (auth.uid() = created_by) with check (auth.uid() = created_by);
