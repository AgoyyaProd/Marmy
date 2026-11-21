-- 0100 — Poudre d'amandes (Ciqual 15041, amande émondée : la poudre du commerce est faite
-- d'amandes émondées). Fruit à coque. L'alias « poudre d'amande » menait jusqu'ici aux
-- amandes entières : il mène désormais à la poudre. Les recettes du catalogue qui
-- demandent des amandes les veulent entières (concassées, grillées) et restent inchangées.
-- Prix : saisie du foyer ou tickets de caisse.

insert into public.ingredients (slug, name, category, default_dimension, is_validated)
select 'poudre-amande', 'Poudre d''amandes', a.category, 'mass', true
from public.ingredients a where a.slug = 'amande';

update public.ingredient_aliases set ingredient_id = (select id from public.ingredients where slug = 'poudre-amande')
where alias_normalized = public.normalize_alias('poudre d amande');

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('poudre d amandes'), ('amandes en poudre'), ('amande en poudre'), ('poudre amande'),
  ('farine d amande'), ('farine d amandes'), ('amandes moulues')
) as v(alias) join public.ingredients i on i.slug = 'poudre-amande'
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'tree_nuts' from public.ingredients i where i.slug = 'poudre-amande';

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, 15041, 'Amande, émondée, sans sel ajouté', 631.0, 21.4, 8.76, 4.63, 52.5, 3.95, 9.9, 0.048
from public.ingredients i where i.slug = 'poudre-amande';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i where i.slug = 'poudre-amande';

do $$
begin
  if (select i.slug from public.ingredient_aliases a join public.ingredients i on i.id = a.ingredient_id
      where a.alias_normalized = public.normalize_alias('poudre d amande')) <> 'poudre-amande' then
    raise exception 'Alias de la poudre d''amandes non déplacé.';
  end if;
end;
$$;
