-- Courses no longer carry a par or a fixed/varies layout; par is entered on every round.
-- Only needed if the first version of schema.sql was already run. Safe to run twice.
-- (Dropping a column also drops the table constraints that reference it.)
alter table public.dg_courses drop column if exists layout_mode;
alter table public.dg_courses drop column if exists fixed_par;
alter table public.dg_rounds  drop column if exists layout_note;
