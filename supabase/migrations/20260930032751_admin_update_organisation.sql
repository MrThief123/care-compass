-- [ADM-10] Admin — Settings: edit the admin's own organisation (FD-02, FD-03)
--
-- admin_update_organisation is the only write path to organisations: no UPDATE policy or grant is
-- added, so a direct table update is still refused. The organisation comes from
-- admin_current_org_id() (ADM-02), never a parameter, so an admin cannot address another one.
-- Errors: 42501 caller is not a signed-in, active admin; 22023 a field is blank or the ABN is not
-- 11 digits. The ABN is stored as 'XX XXX XXX XXX' (no checksum, FD-03).

create or replace function admin_update_organisation(
  p_name text,
  p_abn text,
  p_phone text,
  p_address text
)
returns organisations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := admin_current_org_id();
  v_digits text := regexp_replace(coalesce(p_abn, ''), '[[:space:]]', '', 'g');
  v_row organisations;
begin
  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'an organisation name is required' using errcode = '22023';
  end if;
  if v_digits !~ '^[0-9]{11}$' then
    raise exception 'an ABN with 11 digits is required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_phone, '')), '') is null then
    raise exception 'a phone number is required' using errcode = '22023';
  end if;
  -- Australian numbers only (AC-08): 0X XXXX XXXX (02/03/04/07/08) or +61 without the 0,
  -- 1300/1800 XXX XXX, 13 XX XX. Spaces, hyphens and brackets are ignored.
  if regexp_replace(p_phone, '[ ()-]', '', 'g') !~
     '^((0|\+61)[23478][0-9]{8}|(0|\+61)?1[38]00[0-9]{6}|13[0-9]{4})$' then
    raise exception 'an Australian phone number is required' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_address, '')), '') is null then
    raise exception 'an address is required' using errcode = '22023';
  end if;

  update organisations
  set name = btrim(p_name),
      abn = substr(v_digits, 1, 2) || ' ' || substr(v_digits, 3, 3) || ' ' ||
            substr(v_digits, 6, 3) || ' ' || substr(v_digits, 9, 3),
      phone = btrim(p_phone),
      address = btrim(p_address)
  where id = v_org
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function admin_update_organisation(text, text, text, text) from public, anon, authenticated;
grant execute on function admin_update_organisation(text, text, text, text) to authenticated;

-- No direct table write: without this, RLS would silently match zero rows instead of refusing.
revoke update on organisations from anon, authenticated;
