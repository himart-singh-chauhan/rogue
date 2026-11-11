-- Reward ledger stays append-only, but deleting a member account must still work:
-- the only change allowed on a ledger row is the database clearing admin_id when that admin's
-- account is deleted (ON DELETE SET NULL). Safe to run more than once.
create or replace function reward_transactions_append_only() returns trigger language plpgsql as $$
begin
  if new.id = old.id and new.user_id = old.user_id and new.points = old.points and new.type = old.type
     and new.reference_type is not distinct from old.reference_type
     and new.reference_id is not distinct from old.reference_id
     and new.reason is not distinct from old.reason
     and new.created_at = old.created_at
     and old.admin_id is not null and new.admin_id is null then
    return new;
  end if;
  raise exception 'reward_transactions is append-only; add a correcting transaction instead';
end $$;
