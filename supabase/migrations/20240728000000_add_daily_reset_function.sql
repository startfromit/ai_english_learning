-- Function to check and reset daily play count if it's a new day
create or replace function public.check_and_reset_daily_play_count(user_id uuid)
returns integer as $$
declare
  current_play_count integer;
  v_last_play_date date;
  today_date date := current_date;
begin
  -- Get current usage data
  select daily_play_count, last_play_date 
  into current_play_count, v_last_play_date
  from public.user_usage 
  where id = user_id;
  
  -- If no record exists, create one
  if current_play_count is null then
    insert into public.user_usage (id, daily_play_count, last_play_date)
    values (user_id, 0, today_date);
    return 0;
  end if;
  
  -- If it's a new day, reset the play count
  if v_last_play_date < today_date then
    update public.user_usage 
    set daily_play_count = 0, last_play_date = today_date
    where id = user_id;
    return 0;
  end if;
  
  -- Return current play count
  return current_play_count;
end;
$$ language plpgsql security definer;

-- Function to increment play count
create or replace function public.increment_play_count(user_id uuid)
returns integer as $$
declare
  new_count integer;
begin
  -- First check and reset if needed
  perform public.check_and_reset_daily_play_count(user_id);
  
  -- Then increment the count
  update public.user_usage 
  set daily_play_count = daily_play_count + 1
  where id = user_id;
  
  -- Return the new count
  select daily_play_count into new_count
  from public.user_usage 
  where id = user_id;
  
  return new_count;
end;
$$ language plpgsql security definer;

-- Grant execute permissions
grant execute on function public.check_and_reset_daily_play_count(uuid) to authenticated;
grant execute on function public.increment_play_count(uuid) to authenticated; 