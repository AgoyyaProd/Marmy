-- 0101 — Purée de légumes surgelée (en galets), rayon surgelés. Ciqual 20258 « Légumes
-- (3-4 sortes en mélange), purée ». Ces purées contiennent souvent crème ou beurre selon la
-- marque : lait signalé (à vérifier sur l'étiquette ; mieux vaut écarter à tort qu'exposer).
-- Catégorie légumes : elle compte dans l'équilibre du menu. Prix : saisie du foyer.

insert into public.ingredients (slug, name, category, default_dimension, is_validated, is_frozen)
values ('puree-legumes-surgelee', 'Purée de légumes surgelée', 'legumes', 'mass', true, true);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('puree de legumes surgelee'), ('puree de legumes surgelees'), ('puree de legumes'),
  ('puree legumes surgelee'), ('galets de puree de legumes'), ('puree de legumes en galets')
) as v(alias) join public.ingredients i on i.slug = 'puree-legumes-surgelee'
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'milk' from public.ingredients i where i.slug = 'puree-legumes-surgelee';
insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, 'vegan' from public.ingredients i where i.slug = 'puree-legumes-surgelee';

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, 20258, 'Légumes (3-4 sortes en mélange), purée', 61.2, 1.94, 4.25, 2.4, 3.4, 2.17, 3.3, 0.63
from public.ingredients i where i.slug = 'puree-legumes-surgelee';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i where i.slug = 'puree-legumes-surgelee';
