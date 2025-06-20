-- Create user_usage table
drop table if exists public.user_usage;
create table public.user_usage (
  id uuid references auth.users on delete cascade not null primary key,
  daily_play_count integer not null default 0,
  last_play_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_usage enable row level security;

-- Create policies
create policy "Users can view their own usage"
  on public.user_usage for select
  using (auth.uid() = id);

create policy "Users can update their own usage"
  on public.user_usage for update
  using (auth.uid() = id);

-- Create function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger
create trigger on_user_usage_updated
  before update on public.user_usage
  for each row execute function public.handle_updated_at();
