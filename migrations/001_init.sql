create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_idx on sessions (user_id);

create table password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table login_attempts (
  id bigserial primary key,
  email text not null,
  created_at timestamptz not null default now()
);
create index login_attempts_email_idx on login_attempts (lower(email), created_at);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text,
  body text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references users(id) on delete set null
);
create index submissions_status_idx on submissions (status, created_at desc);

create table prayers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid unique references submissions(id) on delete set null,
  slug text not null unique,
  title text not null,
  body text not null default '',
  cover_file_id uuid,
  font text not null default 'cormorant',
  background text not null default 'pergaminho',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index prayers_published_idx on prayers (published, published_at desc);

create table files (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null unique,
  original_name text not null,
  mime text not null,
  size integer not null,
  kind text not null check (kind in ('image', 'document')),
  submission_id uuid references submissions(id) on delete cascade,
  prayer_id uuid references prayers(id) on delete set null,
  created_at timestamptz not null default now()
);
create index files_submission_idx on files (submission_id);
create index files_prayer_idx on files (prayer_id);

alter table prayers add constraint prayers_cover_fk
  foreign key (cover_file_id) references files(id) on delete set null;
