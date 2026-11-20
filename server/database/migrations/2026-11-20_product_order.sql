-- AMPEX: the admin chooses the order of products in the shop (Curtis, Nov 20). Safe to run more than once.
alter table products add column if not exists sort_order integer;

-- Start from today's order (newest first), so nothing moves until the admin rearranges the shop
with o as (
  select id, (row_number() over (order by created_at desc)) * 10 as n
  from products
  where sort_order is null
)
update products p set sort_order = o.n from o where p.id = o.id;

create index if not exists products_sort_order_idx on products (sort_order);
