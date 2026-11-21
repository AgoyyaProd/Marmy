-- 0102 — Poisson pané surgelé (pavés ou bâtonnets), rayon surgelés. Ciqual 26029 « Poisson
-- pané, surgelé, cru ». Poisson et chapelure de blé : poisson et gluten signalés (recette
-- variable selon la marque, à vérifier sur l'étiquette). Compté au poids : la taille d'un
-- pavé ou d'un bâtonnet varie selon le produit. Prix : saisie du foyer.

insert into public.ingredients (slug, name, category, default_dimension, is_validated, is_frozen)
values ('poisson-pane', 'Poisson pané surgelé', 'poissons', 'mass', true, true);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('poisson pane'), ('panes de poisson'), ('pane de poisson'), ('poissons panes'),
  ('batonnets de poisson'), ('batonnets de poisson panes'), ('pave de poisson pane'),
  ('filets de poisson panes'), ('colin pane'), ('fish sticks')
) as v(alias) join public.ingredients i on i.slug = 'poisson-pane'
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, v.code from public.ingredients i, (values ('fish'), ('gluten')) as v(code)
where i.slug = 'poisson-pane';
insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, v.code from public.ingredients i, (values ('vegan'), ('vegetarian')) as v(code)
where i.slug = 'poisson-pane';

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, 26029, 'Poisson pané, surgelé, cru', 163.0, 11.0, 15.6, 2.2, 6.14, 1.3, 0.9, 0.69
from public.ingredients i where i.slug = 'poisson-pane';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i where i.slug = 'poisson-pane';
