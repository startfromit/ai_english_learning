# 每日播放次数重置功能设置

## 概述
本功能实现了每日凌晨自动重置用户播放次数的逻辑，确保用户每天都有20次播放机会。

## 数据库迁移

### 1. 手动应用迁移
由于Supabase CLI可能有问题，请手动在Supabase Dashboard中执行以下SQL：

```sql
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
```

### 2. 在Supabase Dashboard中执行
1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 SQL Editor
4. 粘贴上述SQL代码并执行

## 功能说明

### 数据库函数

#### `check_and_reset_daily_play_count(user_id)`
- **功能**: 检查并重置每日播放次数
- **逻辑**: 
  - 如果用户记录不存在，创建新记录
  - 如果最后播放日期不是今天，重置播放次数为0
  - 返回当前播放次数

#### `increment_play_count(user_id)`
- **功能**: 增加播放次数（包含重置逻辑）
- **逻辑**:
  - 先调用 `check_and_reset_daily_play_count` 确保日期正确
  - 然后增加播放次数
  - 返回新的播放次数

### API修改

#### TTS API (`/api/azure-tts`, `/api/ttsmaker-tts`)
- 使用 `increment_play_count` 函数
- 在生成TTS前先增加播放次数
- 如果超过限制，返回429错误

#### 获取剩余次数 API (`/api/get-remaining-plays`)
- 使用 `check_and_reset_daily_play_count` 函数
- 只检查不增加播放次数
- 返回剩余播放次数信息

## 测试

### 1. 手动测试
```bash
# 运行测试脚本（需要先设置环境变量）
node test-daily-reset.js
```

### 2. 功能测试
1. 用户播放音频，检查播放次数是否正确增加
2. 达到20次限制后，检查是否显示错误横幅
3. 第二天检查播放次数是否重置为0

## 注意事项

1. **时区**: 重置基于数据库服务器的时区（通常是UTC）
2. **并发**: 函数使用数据库事务确保并发安全
3. **权限**: 函数需要 `security definer` 权限来绕过RLS
4. **错误处理**: API包含完整的错误处理逻辑

## 故障排除

### 常见问题

1. **函数不存在**: 确保SQL已正确执行
2. **权限错误**: 检查函数权限设置
3. **RLS冲突**: 确保函数使用 `security definer`

### 调试步骤

1. 检查Supabase Dashboard中的函数列表
2. 查看API日志中的错误信息
3. 手动测试数据库函数
4. 验证用户认证状态 