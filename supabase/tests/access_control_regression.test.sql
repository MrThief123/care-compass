-- [INT-05] Access-control regression matrix
-- Covers AC-01 (docs/development/shared/shared-access-control-regression/ACCEPTANCE_CRITERIA.md)
--
-- Enumerates pg_catalog directly rather than naming tables, so a future
-- migration that adds a table without enabling RLS fails this test
-- automatically (PRD.md "Error / Edge Cases": "New table without RLS ->
-- test fails (enumerate tables from catalog)").
begin;
select plan(1);

select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p') -- ordinary and partitioned tables only
      and c.relrowsecurity = false
  $$,
  'AC-01: every table in schema public has row level security enabled'
);

select * from finish();
rollback;
