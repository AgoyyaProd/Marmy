import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

/** 0093 : variantes dont le stock compte pour une recette qui demande le parent. */
describe("variantes du stock", () => {
  it("oignon rouge, haricots verts et épinards surgelés, pâtes complètes", async () => {
    const { rows } = await pool.query(
      `select c.slug, p.slug as parent from public.ingredients c
       join public.ingredients p on p.id = c.parent_id
       where c.slug in ('oignon-rouge', 'haricot-vert-surgele', 'epinard-galets', 'pates-completes')
       order by c.slug`,
    );
    expect(rows.map((r) => [r.slug, r.parent])).toEqual([
      ["epinard-galets", "epinard"],
      ["haricot-vert-surgele", "haricot-vert"],
      ["oignon-rouge", "oignon"],
      ["pates-completes", "pates"],
    ]);
  });
});

/** 0094 : jus d'agrume tiré du fruit en stock, au rendement déclaré et sourcé. */
describe("jus d'agrumes", () => {
  it("citron → jus de citron (47 ml), citron vert → jus de citron vert (43 ml)", async () => {
    const { rows } = await pool.query(
      `select p.slug as product, s.slug as source, j.ml_per_piece::text as ml, j.source_note
       from public.ingredient_juice_sources j
       join public.ingredients p on p.id = j.product_id
       join public.ingredients s on s.id = j.source_id order by p.slug`,
    );
    expect(rows.map((r) => [r.product, r.source, r.ml])).toEqual([
      ["jus-citron", "citron", "47.0"],
      ["jus-citron-vert", "citron-vert", "43.0"],
    ]);
    for (const r of rows) expect(r.source_note).toMatch(/USDA/);
  });

  it("lecture seule pour les visiteurs et les comptes", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role anon");
      expect(
        (await client.query("select count(*)::int as n from public.ingredient_juice_sources"))
          .rows[0].n,
      ).toBe(2);
      await expect(
        client.query("delete from public.ingredient_juice_sources"),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});

/** 0095 : céréales et pâtes torti. */
describe("céréales et torti", () => {
  it("nouveaux produits, allergènes, variante et alias", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, n.ciqual_code,
         array(select a.allergen_code from public.ingredient_allergens a
               where a.ingredient_id = i.id) as allergens
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('melange-cereales', 'ble-precuit', 'sarrasin', 'pates-torti')
       order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "ble-precuit", parent: null, ciqual_code: 9080, allergens: ["gluten"] },
      { slug: "melange-cereales", parent: null, ciqual_code: null, allergens: ["gluten"] },
      { slug: "pates-torti", parent: "pates", ciqual_code: 9810, allergens: ["gluten"] },
      { slug: "sarrasin", parent: null, ciqual_code: 9380, allergens: [] },
    ]);
    const alias = await pool.query(
      `select i.slug from public.ingredient_aliases a join public.ingredients i on i.id = a.ingredient_id
       where a.alias_normalized = public.normalize_alias('Tortis')`,
    );
    expect(alias.rows[0]?.slug).toBe("pates-torti");
  });
});

/** 0096 : farines T00 et multi-céréales. */
describe("farines T00 et multi-céréales", () => {
  it("la T00 est une variante de la farine, la multi-céréales non", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, n.ciqual_code,
         array(select a.allergen_code from public.ingredient_allergens a
               where a.ingredient_id = i.id) as allergens
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('farine-t00', 'farine-multicereales') order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "farine-multicereales", parent: null, ciqual_code: null, allergens: ["gluten"] },
      { slug: "farine-t00", parent: "farine", ciqual_code: 9440, allergens: ["gluten"] },
    ]);
  });
});

/** 0097 : farine de gruau et graines de chia. */
describe("farine de gruau et chia", () => {
  it("gruau variante de la farine, chia avec sa nutrition", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, n.ciqual_code
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('farine-gruau', 'graine-chia') order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "farine-gruau", parent: "farine", ciqual_code: 9440 },
      { slug: "graine-chia", parent: null, ciqual_code: 15047 },
    ]);
  });
});

/** 0098 : feuilles de riz, comptées à la feuille. */
describe("feuilles de riz", () => {
  it("à la pièce, trouvées par « papier de riz »", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension, i.piece_weight_g::float as g from public.ingredient_aliases a
       join public.ingredients i on i.id = a.ingredient_id
       where a.alias_normalized = public.normalize_alias('Papier de riz')`,
    );
    expect(rows).toEqual([{ slug: "feuille-riz", default_dimension: "count", g: 10 }]);
  });
});

/** 0099 : choux de Bruxelles frais et surgelés. */
describe("choux de Bruxelles", () => {
  it("frais et surgelés (variante, rayon surgelés), avec leur nutrition", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, i.is_frozen, n.ciqual_code
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug like 'chou-bruxelles%' order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "chou-bruxelles", parent: null, is_frozen: false, ciqual_code: 20058 },
      {
        slug: "chou-bruxelles-surgele",
        parent: "chou-bruxelles",
        is_frozen: true,
        ciqual_code: 20206,
      },
    ]);
  });
});

/** 0100 : poudre d'amandes, distincte des amandes entières. */
describe("poudre d'amandes", () => {
  it("les alias de la poudre y mènent, « amandes » reste aux entières", async () => {
    const { rows } = await pool.query(
      `select v.alias, i.slug from (values ('Poudre d''amande'), ('Amandes en poudre'),
         ('Amandes')) as v(alias)
       join public.ingredient_aliases a on a.alias_normalized = public.normalize_alias(v.alias)
       join public.ingredients i on i.id = a.ingredient_id order by v.alias`,
    );
    expect(rows.map((r) => [r.alias, r.slug])).toEqual([
      ["Amandes", "amande"],
      ["Amandes en poudre", "poudre-amande"],
      ["Poudre d'amande", "poudre-amande"],
    ]);
    const al = await pool.query(
      `select a.allergen_code from public.ingredient_allergens a
       join public.ingredients i on i.id = a.ingredient_id where i.slug = 'poudre-amande'`,
    );
    expect(al.rows.map((r) => r.allergen_code)).toEqual(["tree_nuts"]);
  });
});

/** 0101 : purée de légumes surgelée. */
describe("purée de légumes surgelée", () => {
  it("surgelée, légume, lait signalé, nutrition Ciqual", async () => {
    const { rows } = await pool.query(
      `select i.is_frozen, i.category, n.ciqual_code,
         array(select a.allergen_code from public.ingredient_allergens a where a.ingredient_id = i.id) as allergens,
         array(select d.diet_code from public.ingredient_diet_conflicts d where d.ingredient_id = i.id) as diets
       from public.ingredients i join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug = 'puree-legumes-surgelee'`,
    );
    expect(rows).toEqual([
      {
        is_frozen: true,
        category: "legumes",
        ciqual_code: 20258,
        allergens: ["milk"],
        diets: ["vegan"],
      },
    ]);
  });
});

/** 0102 : poisson pané surgelé. */
describe("poisson pané", () => {
  it("surgelé, poisson et gluten, exclu des régimes végétariens", async () => {
    const { rows } = await pool.query(
      `select i.is_frozen, n.ciqual_code,
         array(select a.allergen_code from public.ingredient_allergens a where a.ingredient_id = i.id order by 1) as allergens,
         array(select d.diet_code from public.ingredient_diet_conflicts d where d.ingredient_id = i.id order by 1) as diets
       from public.ingredients i join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug = 'poisson-pane'`,
    );
    expect(rows).toEqual([
      {
        is_frozen: true,
        ciqual_code: 26029,
        allergens: ["fish", "gluten"],
        diets: ["vegan", "vegetarian"],
      },
    ]);
  });
});
