-- Fare Iti · entraide entre joueurs (Supabase)
-- Already installed in the Supabase project "fare-iti" (2026-11-09). To rebuild elsewhere, paste this whole file into Supabase › SQL Editor › New query › Run.
-- Then: Authentication › Sign In / Providers › turn ON "Allow anonymous sign-ins".
-- Safety rules built in: no free text (ready-made messages only, by number),
-- friends only by code, gifts limited (allowed items, small amounts, once a day),
-- every table is closed (RLS on, no policies): players only go through the
-- functions below, which check everything.

create table if not exists players(
  id uuid primary key,
  code text unique not null,
  name text not null default '',
  lv int not null default 1,
  sponsor uuid references players(id) on delete set null,
  created_at timestamptz not null default now(),
  seen timestamptz not null default now());
create table if not exists friends(
  a uuid not null references players(id) on delete cascade,
  b uuid not null references players(id) on delete cascade,
  since timestamptz not null default now(),
  primary key(a,b));
create table if not exists helps(
  id bigserial primary key,
  owner uuid not null references players(id) on delete cascade,
  kind text not null check (kind in ('need','cyclone')),
  item text not null,
  qty int not null check (qty between 1 and 10),
  got int not null default 0,
  open boolean not null default true,
  created_at timestamptz not null default now());
create table if not exists gifts(
  id bigserial primary key,
  from_id uuid references players(id) on delete cascade,
  to_id uuid not null references players(id) on delete cascade,
  item text not null,
  qty int not null check (qty between 1 and 5),
  msg smallint not null default 0 check (msg between 0 and 29),
  kind text not null default 'gift' check (kind in ('gift','help','welcome','goal')),
  help_id bigint references helps(id) on delete set null,
  day date not null default current_date,
  claimed boolean not null default false,
  created_at timestamptz not null default now());
create unique index if not exists gifts_daily on gifts(from_id,to_id,day) where kind='gift';
create unique index if not exists gifts_help_once on gifts(from_id,help_id) where kind='help';
create index if not exists gifts_inbox on gifts(to_id) where not claimed;
create table if not exists guestbook(
  id bigserial primary key,
  host uuid not null references players(id) on delete cascade,
  author uuid not null references players(id) on delete cascade,
  msg smallint not null check (msg between 0 and 29),
  day date not null default current_date,
  created_at timestamptz not null default now(),
  unique(host,author,day));
create table if not exists goal_contrib(
  week text not null,
  player uuid not null references players(id) on delete cascade,
  kind text not null,
  amount int not null default 0,
  primary key(week,player,kind));

alter table players enable row level security;
alter table friends enable row level security;
alter table helps enable row level security;
alter table gifts enable row level security;
alter table guestbook enable row level security;
alter table goal_contrib enable row level security;

create or replace function fi_items() returns text[] language sql immutable set search_path=public as $$
  select array['coconut','banana','fish','taro','uru','fei','papaya','egg','water','log','plank','rope','frond','stone','bamboo','pupu','tiare','fert','salade','tomate','concombre','thatch','strips']::text[] $$;
create or replace function fi_is_friend(x uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from friends where a=auth.uid() and b=x) $$;

-- join or refresh: returns your friend code
create or replace function fi_join(p_name text, p_lv int) returns text language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); c text; abc text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  if me is null then raise exception 'not signed in'; end if;
  select code into c from players where id=me;
  if c is null then
    loop
      c := '';
      for i in 1..6 loop c := c || substr(abc, 1+floor(random()*length(abc))::int, 1); end loop;
      exit when not exists(select 1 from players where code=c);
    end loop;
    insert into players(id,code,name,lv) values(me,c,left(coalesce(p_name,''),16),greatest(1,least(coalesce(p_lv,1),99)));
  else
    update players set name=left(coalesce(p_name,''),16), lv=greatest(1,least(coalesce(p_lv,1),99)), seen=now() where id=me;
  end if;
  return c;
end $$;

-- add a friend by code; as_sponsor: this friend is my parrain/marraine (new players only)
create or replace function fi_add_friend(p_code text, p_sponsor boolean default false) returns text language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); f players; mine players;
begin
  select * into mine from players where id=me; if mine.id is null then raise exception 'join first'; end if;
  select * into f from players where code=upper(trim(p_code)); if f.id is null then raise exception 'unknown code'; end if;
  if f.id=me then raise exception 'own code'; end if;
  if (select count(*) from friends where a=me) >= 60 then raise exception 'too many friends'; end if;
  insert into friends(a,b) values(me,f.id),(f.id,me) on conflict do nothing;
  if p_sponsor and mine.sponsor is null and mine.created_at > now() - interval '14 days' and f.created_at < mine.created_at then
    update players set sponsor=f.id where id=me;
    insert into gifts(from_id,to_id,item,qty,msg,kind) values(f.id,me,'rope',3,1,'welcome'),(f.id,me,'coconut',5,1,'welcome'),(me,f.id,'tiare',3,0,'welcome');
  end if;
  return f.name;
end $$;

create or replace function fi_remove_friend(p_id uuid) returns void language sql security definer set search_path=public as $$
  delete from friends where (a=auth.uid() and b=p_id) or (b=auth.uid() and a=p_id) $$;

-- a gift from your own bag (the game removes it from your bag first)
create or replace function fi_send_gift(p_to uuid, p_item text, p_qty int, p_msg int default 0, p_help bigint default null) returns void language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); h helps;
begin
  if not fi_is_friend(p_to) then raise exception 'not a friend'; end if;
  if not (p_item = any(fi_items())) then raise exception 'item not allowed'; end if;
  if p_help is null then
    insert into gifts(from_id,to_id,item,qty,msg,kind) values(me,p_to,p_item,least(greatest(p_qty,1),3),least(greatest(p_msg,0),29),'gift');
  else
    select * into h from helps where id=p_help and owner=p_to and open for update;
    if h.id is null then raise exception 'help closed'; end if;
    if p_item<>h.item then raise exception 'wrong item'; end if;
    insert into gifts(from_id,to_id,item,qty,msg,kind,help_id) values(me,p_to,p_item,least(greatest(p_qty,1),least(5,h.qty-h.got)),least(greatest(p_msg,0),29),'help',p_help);
    update helps set got=got+least(greatest(p_qty,1),least(5,h.qty-h.got)), open=(got+least(greatest(p_qty,1),least(5,h.qty-h.got)))<qty where id=p_help;
  end if;
end $$;

-- ask your friends for help (one open request at a time)
create or replace function fi_ask_help(p_kind text, p_item text, p_qty int) returns bigint language plpgsql security definer set search_path=public as $$
declare me uuid := auth.uid(); nid bigint;
begin
  if not (p_item = any(fi_items())) then raise exception 'item not allowed'; end if;
  update helps set open=false where owner=me and open;
  insert into helps(owner,kind,item,qty) values(me,p_kind,p_item,least(greatest(p_qty,1),10)) returning id into nid;
  return nid;
end $$;
create or replace function fi_close_help() returns void language sql security definer set search_path=public as $$
  update helps set open=false where owner=auth.uid() and open $$;

-- received gifts not yet opened; fi_claim marks them opened and returns them once
create or replace function fi_inbox() returns table(id bigint, from_name text, item text, qty int, msg smallint, kind text, created_at timestamptz) language sql stable security definer set search_path=public as $$
  select g.id, coalesce(p.name,''), g.item, g.qty, g.msg, g.kind, g.created_at from gifts g left join players p on p.id=g.from_id
  where g.to_id=auth.uid() and not g.claimed order by g.created_at limit 50 $$;
create or replace function fi_claim(p_ids bigint[]) returns table(id bigint, from_name text, item text, qty int, msg smallint, kind text) language sql security definer set search_path=public as $$
  with c as (update gifts set claimed=true where to_id=auth.uid() and not claimed and gifts.id = any(p_ids) returning gifts.id, gifts.from_id, gifts.item, gifts.qty, gifts.msg, gifts.kind)
  select c.id, coalesce(p.name,''), c.item, c.qty, c.msg, c.kind from c left join players p on p.id=c.from_id $$;

-- my friends, with what I can do for them today
create or replace function fi_friends() returns table(id uuid, name text, lv int, seen timestamptz, gave_today boolean, signed_today boolean, is_sponsor boolean, is_godchild boolean,
  help_id bigint, help_kind text, help_item text, help_qty int, help_got int, helped boolean) language sql stable security definer set search_path=public as $$
  select p.id, p.name, p.lv, p.seen,
    exists(select 1 from gifts g where g.from_id=auth.uid() and g.to_id=p.id and g.kind='gift' and g.day=current_date),
    exists(select 1 from guestbook s where s.author=auth.uid() and s.host=p.id and s.day=current_date),
    p.id=(select sponsor from players where id=auth.uid()), p.sponsor=auth.uid(),
    h.id, h.kind, h.item, h.qty, h.got,
    exists(select 1 from gifts g where g.from_id=auth.uid() and g.help_id=h.id)
  from friends f join players p on p.id=f.b left join lateral (select * from helps where owner=p.id and open order by created_at desc limit 1) h on true
  where f.a=auth.uid() order by p.seen desc $$;
create or replace function fi_my_help() returns table(id bigint, kind text, item text, qty int, got int) language sql stable security definer set search_path=public as $$
  select id, kind, item, qty, got from helps where owner=auth.uid() and open order by created_at desc limit 1 $$;

-- guest book: a ready-made message once a day per friend
create or replace function fi_sign(p_host uuid, p_msg int) returns void language plpgsql security definer set search_path=public as $$
begin
  if not fi_is_friend(p_host) then raise exception 'not a friend'; end if;
  insert into guestbook(host,author,msg) values(p_host,auth.uid(),least(greatest(p_msg,0),29)) on conflict do nothing;
end $$;
create or replace function fi_guestbook() returns table(author text, msg smallint, created_at timestamptz) language sql stable security definer set search_path=public as $$
  select coalesce(p.name,''), s.msg, s.created_at from guestbook s left join players p on p.id=s.author where s.host=auth.uid() order by s.created_at desc limit 30 $$;

-- Objectif du fenua: everyone's good deeds of the week add up
create or replace function fi_contrib(p_kind text, p_amount int) returns void language plpgsql security definer set search_path=public as $$
declare w text := to_char(now(),'IYYY-IW');
begin
  if auth.uid() is null or p_amount<=0 then return; end if;
  insert into goal_contrib(week,player,kind,amount) values(w,auth.uid(),left(p_kind,16),least(p_amount,50))
  on conflict(week,player,kind) do update set amount=least(goal_contrib.amount+least(excluded.amount,50),400);
end $$;
create or replace function fi_goal(p_kind text) returns table(week text, total bigint, mine int, players bigint) language sql stable security definer set search_path=public as $$
  select to_char(now(),'IYYY-IW'), coalesce(sum(amount),0), coalesce(max(case when player=auth.uid() then amount end),0), count(*)
  from goal_contrib where week=to_char(now(),'IYYY-IW') and kind=p_kind $$;

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function fi_join(text,int), fi_add_friend(text,boolean), fi_remove_friend(uuid), fi_send_gift(uuid,text,int,int,bigint), fi_ask_help(text,text,int), fi_close_help(),
  fi_inbox(), fi_claim(bigint[]), fi_friends(), fi_my_help(), fi_sign(uuid,int), fi_guestbook(), fi_contrib(text,int), fi_goal(text) to authenticated;
