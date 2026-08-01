-- webtoon_rankings: anon 키로 SELECT가 막혀 홈이 빈 화면이 됩니다.
-- Supabase Dashboard → SQL Editor 에서 실행하세요.

alter table public.webtoon_rankings enable row level security;

drop policy if exists "Allow public read webtoon_rankings" on public.webtoon_rankings;

create policy "Allow public read webtoon_rankings"
on public.webtoon_rankings
for select
to anon, authenticated
using (true);
