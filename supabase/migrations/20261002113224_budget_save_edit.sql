-- [FAM-11] Family — Update funds (Edit budget)
--
-- save_budget_edit(client, buckets, added, note): applies one whole Edit budget save in one transaction,
-- built on the F0-12 functions so every rule (amounts, balance limit, pending settlement, recorder) stays
-- in one place. Any wrong field refuses the whole save (PD-059); the refusal carries the field path in
-- `detail`, in the keys the page already uses: buckets.<i>.amount|name|remove, added.<i>.name|startingAmount.
--
--   p_buckets  jsonb array of {id, name, direction ('add'|'remove'), amount, remove}
--   p_added    jsonb array of {name, starting_amount}
--   p_note     one optional note, kept on every row the save writes
--
-- Order: removals, renames, fund changes, then added buckets, so a name freed by a removal or a rename can
-- be reused in the same save. Rows with amount 0, no rename and no removal write nothing.
-- Errors: 42501 not permitted (also an unknown bucket, or one of another client), 22023 bad field or a
-- bucket already removed, 23505 name taken.
create or replace function save_budget_edit(
  p_client_id uuid,
  p_buckets jsonb,
  p_added jsonb,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buckets jsonb := coalesce(p_buckets, '[]'::jsonb);
  v_added jsonb := coalesce(p_added, '[]'::jsonb);
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_bucket budget_buckets;
  v_row jsonb;
  v_i int;
  v_name text;
  v_amount numeric;
  v_remove boolean;
  v_path text;
  v_state text;
  v_message text;
begin
  if auth.uid() is null or p_client_id is null or not can_edit_budget(p_client_id) then
    raise exception 'not permitted to change this budget' using errcode = '42501';
  end if;
  if jsonb_typeof(v_buckets) <> 'array' or jsonb_typeof(v_added) <> 'array' then
    raise exception 'the budget changes are not valid' using errcode = '22023';
  end if;

  -- Lock every saved bucket the save touches. Unknown, another client's or not editable: 42501, saying
  -- nothing about it. Already removed (by someone else meanwhile): 22023 with no field.
  for v_i in 0 .. jsonb_array_length(v_buckets) - 1 loop
    begin
      v_bucket := budget_bucket_for_write((v_buckets -> v_i ->> 'id')::uuid);
    exception when invalid_text_representation then
      raise exception 'not permitted to change this budget' using errcode = '42501';
    end;
    if v_bucket.client_id <> p_client_id then
      raise exception 'not permitted to change this budget' using errcode = '42501';
    end if;
  end loop;

  -- 1. Removals
  for v_i in 0 .. jsonb_array_length(v_buckets) - 1 loop
    v_row := v_buckets -> v_i;
    v_remove := coalesce((v_row ->> 'remove')::boolean, false);
    if v_remove then
      v_path := format('buckets.%s.remove', v_i);
      begin
        perform remove_bucket((v_row ->> 'id')::uuid, v_note);
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
        if v_state = '22023' then
          raise exception '%', v_message using errcode = '22023', detail = v_path;
        end if;
        raise;
      end;
    end if;
  end loop;

  -- 2. Renames (every kept bucket's name is checked, changed or not)
  for v_i in 0 .. jsonb_array_length(v_buckets) - 1 loop
    v_row := v_buckets -> v_i;
    v_remove := coalesce((v_row ->> 'remove')::boolean, false);
    if not v_remove then
      v_path := format('buckets.%s.name', v_i);
      begin
        v_name := budget_clean_name(v_row ->> 'name');
        select * into v_bucket from budget_buckets where id = (v_row ->> 'id')::uuid;
        if v_name <> v_bucket.name then
          perform rename_bucket(v_bucket.id, v_name);
        end if;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
        if v_state = '23505' then
          raise exception 'Another bucket already has this name.' using errcode = '23505', detail = v_path;
        elsif v_state = '22023' then
          raise exception '%', v_message using errcode = '22023', detail = v_path;
        end if;
        raise;
      end;
    end if;
  end loop;

  -- 3. Fund changes
  for v_i in 0 .. jsonb_array_length(v_buckets) - 1 loop
    v_row := v_buckets -> v_i;
    v_remove := coalesce((v_row ->> 'remove')::boolean, false);
    if not v_remove then
      v_path := format('buckets.%s.amount', v_i);
      begin
        v_amount := coalesce((v_row ->> 'amount')::numeric, 0);
        if v_amount <> 0 then
          if v_row ->> 'direction' = 'add' then
            perform add_funds((v_row ->> 'id')::uuid, v_amount, v_note);
          elsif v_row ->> 'direction' = 'remove' then
            perform remove_funds((v_row ->> 'id')::uuid, v_amount, v_note);
          else
            raise exception 'choose whether to add or remove funds' using errcode = '22023';
          end if;
        end if;
      exception when others then
        get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
        if v_state in ('22P02', '22003') then
          -- an amount that is not a number
          raise exception 'enter an amount more than $0, with at most 2 decimal places' using errcode = '22023', detail = v_path;
        elsif v_state = '22023' then
          raise exception '%', v_message using errcode = '22023', detail = v_path;
        end if;
        raise;
      end;
    end if;
  end loop;

  -- 4. Added buckets
  for v_i in 0 .. jsonb_array_length(v_added) - 1 loop
    v_row := v_added -> v_i;
    v_path := format('added.%s.name', v_i);
    begin
      v_name := budget_clean_name(v_row ->> 'name');
      v_path := format('added.%s.startingAmount', v_i);
      begin
        v_amount := (v_row ->> 'starting_amount')::numeric;
      exception when others then
        v_amount := null;
      end;
      perform budget_check_amount(v_amount, true);
      v_path := format('added.%s.name', v_i);
      perform add_bucket(p_client_id, v_name, v_amount, null, v_note);
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
      if v_state = '23505' then
        raise exception 'Another bucket already has this name.' using errcode = '23505', detail = v_path;
      elsif v_state = '22023' then
        raise exception '%', v_message using errcode = '22023', detail = v_path;
      end if;
      raise;
    end;
  end loop;
end;
$$;

revoke all on function save_budget_edit(uuid, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function save_budget_edit(uuid, jsonb, jsonb, text) to authenticated;
