-- 0103 — Dates de publication et de mise à jour des recettes lisibles par les visiteurs
-- (référencement : datePublished / dateModified des données structurées, lastmod du plan
-- du site). Seulement les dates : ni l'auteur de la validation, ni la source.

grant select (created_at, updated_at, validated_at) on public.recipes to anon;
