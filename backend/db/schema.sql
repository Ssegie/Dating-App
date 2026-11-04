create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  uid text unique not null,                 -- Firebase UID (or dev id locally)
  name text not null,
  birthdate date not null,
  gender text not null default 'o',         -- w | m | o
  bio text not null default '',
  job text,
  school text,
  tags text[] not null default '{}',
  hue int not null default 340,
  photos jsonb not null default '[["🙂","About me"]]',
  lat double precision not null default 0.3476,
  lng double precision not null default 32.5825,
  show text not null default 'everyone',    -- everyone | w | m
  dist_max int not null default 25,
  age_min int not null default 18,
  age_max int not null default 60,
  super_left int not null default 3,
  super_day date not null default current_date,
  is_bot boolean not null default false,    -- demo profiles
  likes_you boolean not null default false, -- demo bots that like you back
  created_at timestamptz not null default now()
);

create table if not exists swipes (
  swiper uuid not null references users(id) on delete cascade,
  target uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('like','nope','super')),
  created_at timestamptz not null default now(),
  primary key (swiper, target)
);
create index if not exists swipes_target_idx on swipes(target);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references users(id) on delete cascade,
  user_b uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists messages (
  id bigserial primary key,
  match_id uuid not null references matches(id) on delete cascade,
  sender uuid not null references users(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists messages_match_idx on messages(match_id, created_at);

create table if not exists blocks (
  blocker uuid not null references users(id) on delete cascade,
  blocked uuid not null references users(id) on delete cascade,
  primary key (blocker, blocked)
);
create table if not exists reports (
  id bigserial primary key,
  reporter uuid not null references users(id) on delete cascade,
  reported uuid not null references users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

-- ---- Photos, moderation and safety (added after v0.1) ----
alter table users add column if not exists hidden boolean not null default false;  -- hidden from discovery pending review

create table if not exists user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  position int not null default 0,
  data bytea not null,
  status text not null default 'approved' check (status in ('approved','pending','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists user_photos_user_idx on user_photos(user_id, position);

create unique index if not exists reports_pair_idx on reports(reporter, reported);
