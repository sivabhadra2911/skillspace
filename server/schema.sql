create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  user_type text not null default 'freelancer' check (user_type in ('freelancer','recruiter')),
  created_at timestamptz not null default now()
);
create table if not exists profiles (
  id uuid primary key references users(id) on delete cascade,
  full_name text not null,
  user_type text not null default 'freelancer',
  title text,
  location text,
  bio text,
  skills text[] not null default '{}',
  avatar_url text,
  company_name text,
  hourly_rate numeric,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references users(id) on delete cascade,
  title text not null,
  company text not null,
  location text not null default 'Remote',
  job_type text not null default 'Contract',
  category text not null default 'Development',
  salary text not null default 'Competitive',
  description text not null,
  skills text[] not null default '{}',
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_created_idx on jobs(status,created_at desc);
create index if not exists jobs_recruiter_idx on jobs(recruiter_id);
create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  cover_letter text not null,
  status text not null default 'applied' check (status in ('applied','reviewing','interview','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id,user_id)
);
create index if not exists applications_user_idx on job_applications(user_id,created_at desc);
create index if not exists applications_job_idx on job_applications(job_id);
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','in-progress','completed')),
  project text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_due_idx on tasks(user_id,due_date);
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  event_type text not null default 'meeting',
  is_all_day boolean not null default false,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists calendar_user_start_idx on calendar_events(user_id,start_time);
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create index if not exists chat_sender_created_idx on chat_messages(sender_id,created_at);
create index if not exists chat_receiver_created_idx on chat_messages(receiver_id,created_at);
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text not null,
  topic text not null default 'Discussion',
  created_at timestamptz not null default now()
);
create index if not exists community_created_idx on community_posts(created_at desc);
