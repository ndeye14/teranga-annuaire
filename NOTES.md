# Notes — Annuaire des Menuisiers de Dakar

Carnet de bord des commandes importantes et des concepts appris pendant ce projet
d'entraînement (avant d'attaquer **Teranga 3D**).

---

## Stack

- **Framework** : Next.js 16 (App Router) + TypeScript
- **Style** : Tailwind v4 (la config se fait dans `globals.css`, plus de `tailwind.config.js`)
- **ORM** : Prisma 7 (nouveau générateur `prisma-client`, driver adapter pattern)
- **DB** : Postgres hébergé sur Supabase (free tier)
- **Driver pg** : `pg` + `@prisma/adapter-pg` (Prisma 7 ne ship plus son propre driver)
- **Déploiement** : Vercel — live à [`teranga-annuaire.vercel.app`](https://teranga-annuaire.vercel.app/)

---

## Commandes utilisées

### Setup initial du projet

```powershell
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint --no-turbopack --use-npm
```
> Scaffold un projet Next.js dans le dossier courant avec TS, Tailwind, App Router, code dans `src/`, alias `@/...`, ESLint, sans Turbopack (Webpack par défaut, plus stable pour débuter).

```powershell
npm run dev
```
> Lance le serveur de dev Next.js sur `http://localhost:3000`. À utiliser à chaque session de code.

### Setup Prisma

```powershell
npm install --save-dev prisma
```
> Installe la **CLI Prisma** en devDep (`prisma migrate`, `prisma studio`, `prisma generate`…). Pas besoin en prod.

```powershell
npm install @prisma/client
```
> Installe la **base du client Prisma** (sans le driver). Utilisé au runtime.

```powershell
npx prisma init --datasource-provider postgresql
```
> Crée `prisma/schema.prisma`, `prisma.config.ts` et `.env`. À ne lancer qu'**une fois** au début du projet.

### Driver Postgres + Adapter (spécifique Prisma 7)

```powershell
npm install @prisma/adapter-pg pg
```
> Installe le driver Postgres (`pg`) et l'adapter Prisma qui fait le pont entre `pg` et `PrismaClient`. Depuis Prisma 7, on apporte son propre driver.

```powershell
npm install --save-dev tsx @types/pg dotenv
```
> `tsx` = exécuter des fichiers `.ts` directement (pour le seed). `@types/pg` = types TS pour `pg`. `dotenv` = charger `.env` dans un script Node hors Next.js.

### Workflow quotidien Prisma

```powershell
npx prisma migrate dev --name <nom-de-la-migration>
```
> Détecte les changements du `schema.prisma`, génère un fichier SQL dans `prisma/migrations/`, l'applique à la DB, et régénère le client TS. À lancer à chaque fois qu'on modifie le schéma.

```powershell
npx prisma generate
```
> Régénère uniquement le client TypeScript dans `src/generated/prisma/` (sans toucher la DB). Utile après un `npm install` qui a écrasé les fichiers générés, ou après `git pull` avec un schéma modifié par un coéquipier.

```powershell
npx prisma db seed
```
> Lance le script de seed déclaré dans `prisma.config.ts` (chez nous : `tsx prisma/seed.ts`).

```powershell
npx prisma studio
```
> Ouvre une UI graphique sur `http://localhost:5555` pour voir/éditer les données à la souris. Très pratique pour vérifier rapidement l'état de la DB.

```powershell
npx prisma migrate reset
```
> ⚠️ **DESTRUCTIF** : drop toute la DB, ré-applique toutes les migrations, relance le seed. À utiliser uniquement en dev quand on veut repartir propre.

### Build & déploiement

```powershell
npm run build
```
> Compile la prod (TS check + lint + bundle). À lancer en local **avant chaque push** — si ça pète ici, ça pétera sur Vercel et tu perdras 2 min de logs.

```powershell
npm run start
```
> Lance le serveur en mode prod (sur le build de `.next/`). Utile pour tester localement le rendu exact que les utilisateurs verront.

> 💡 **Script `postinstall`** : on a ajouté `"postinstall": "prisma generate"` dans `package.json`. Vercel l'exécute automatiquement après `npm install`. Sans ça, le build échouerait car `src/generated/prisma/` est gitignored donc absent après le clone.

### Git — préparer et pousser sur GitHub

```powershell
git status
```
> Affiche les fichiers modifiés / non-trackés. **Vérifier que `.env` n'apparaît pas** avant tout commit — si oui, le password Supabase fuite publiquement sur GitHub.

```powershell
git branch -m master main
```
> Renomme la branche locale `master` (créée par défaut par `git init`) en `main` (convention GitHub depuis 2020). À faire **avant le premier push**.

```powershell
git add <fichiers>
```
> Stage explicitement les fichiers à committer. Préférer la liste explicite à `git add .` ou `git add -A` : on évite de committer un fichier qu'on n'a pas voulu (dump SQL, screenshot, etc.).

```powershell
git commit -m "feat: ..."
```
> Crée un commit. Préférer un préfixe type Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) — utile quand on devra générer un changelog plus tard.

```powershell
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```
> Lie le repo local au repo distant GitHub et pousse `main`. Le `-u` (`--set-upstream`) lie la branche locale à la distante → les prochains `git push` / `git pull` se passent d'arguments.

> ⚠️ **Piège GitHub** : à la création d'un nouveau repo sur github.com, **NE PAS COCHER** les options "Add a README", "Add .gitignore", "Choose a license". Elles créent un commit initial côté distant qui divergera de ton historique local et bloquera ton premier push (`non-fast-forward error`). Toujours créer le repo **vide** côté GitHub.

### Vercel — déployer

Workflow (tout dans le navigateur sur **[vercel.com/new](https://vercel.com/new)**) :

1. **Import** du repo GitHub (Vercel liste tes repos automatiquement si tu t'es connecté via GitHub).
2. **Configure Project** : laisse tout par défaut. Vercel détecte Next.js, choisit `npm run build`, etc.
3. **Environment Variables** — section à déplier :
   - `DATABASE_URL` = la pooled URL (port 6543) avec password URL-encodé. **Rien d'autre.**
4. **Deploy** → build (~60-90s) → URL `<projet>.vercel.app`.

**Pourquoi seulement `DATABASE_URL` sur Vercel (pas `DIRECT_URL`)** :
- `DIRECT_URL` n'est utilisée que par la CLI Prisma (`migrate`, `studio`) lancée depuis ta machine de dev
- Sur Vercel, on ne lance jamais de migration — on exécute juste le code de l'app au runtime
- Le runtime utilise le pooler (`DATABASE_URL`), point.

**Pourquoi le pooler (port 6543) pour Vercel** : chaque requête sur Vercel tourne dans une fonction serverless éphémère. PgBouncer en transaction mode est conçu pour ce pattern (beaucoup de connexions courtes). Le port 5432 saturerait Postgres au bout de quelques dizaines de requêtes simultanées.

**Workflow continu après le premier déploiement** :
```powershell
# 1. Bosser local
# 2. Tester en local : npm run build
git add ...
git commit -m "..."
git push
```
Vercel détecte le push, re-build et re-déploie automatiquement. Pas besoin de toucher quoi que ce soit dans son interface, sauf si on change le schéma Prisma → là il faut **d'abord lancer `prisma migrate dev` en local** (qui modifie Supabase) **puis push**. Si tu push une migration sans l'avoir appliquée à Supabase, le build prod marchera mais l'app crashera au runtime parce que la table/colonne attendue n'existe pas.

---

## Connexion Supabase — pièges rencontrés

### Pourquoi DEUX URLs ?
- **`DATABASE_URL`** (pooled, port 6543) → utilisée par l'app au runtime. Passe par PgBouncer (transaction mode), Vercel-friendly. Toujours mettre `?pgbouncer=true&connection_limit=1` à la fin.
- **`DIRECT_URL`** (port 5432) → utilisée uniquement par la CLI Prisma (`migrate`, `studio`). Connexion en "session mode", supporte tout ce que les migrations ont besoin (advisory locks, prepared statements).

### Piège IPv6
Depuis 2024, l'endpoint `db.xxx.supabase.co` (la connexion vraiment directe) est **IPv6-only**. La plupart des FAI sénégalais ne routent pas IPv6 → erreur `P1001 Can't reach database server`.

**Solution** : utiliser le pooler Supavisor pour `DIRECT_URL` aussi, en mode session :
```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```
Note bien : port **5432** (session mode) et username avec `.<project-ref>` (différent de la connexion directe).

### Mot de passe avec caractères spéciaux
Les caractères spéciaux dans le password doivent être **URL-encodés** dans le `.env` :
- `@` → `%40`
- `#` → `%23`
- `/` → `%2F`
- etc.

---

## Concepts Prisma appris

| Concept | Résumé |
|---|---|
| **Schéma** | Source unique de vérité, fichier `prisma/schema.prisma` |
| **Migration** | Fichier SQL versionné dans `prisma/migrations/`, à committer dans Git |
| **Client généré** | Code TypeScript dans `src/generated/prisma/`, regénéré à chaque `prisma generate`. **Non commit** (gitignored), reproduit en prod via le script `postinstall`. |
| **Code généré dans `.gitignore`** | Règle générale : tout fichier auto-généré à partir d'une source de vérité (client Prisma, build, node_modules) ne se commit JAMAIS. |
| **Singleton + HMR** | Pattern `globalThis` dans `src/lib/prisma.ts`. En dev, Next.js réexécute les modules à chaud → sans singleton, on crée une nouvelle instance `PrismaClient` à chaque sauvegarde → saturation des connexions DB. Le pattern survit aux re-imports. Inutile en prod. |
| **`@unique`** | Contrainte SQL d'unicité, permet `findUnique({ where: { slug } })`. |
| **`String[]`** | Array natif Postgres, parfait pour des listes courtes sans table de jointure. |
| **`@default(cuid())`** | ID court, URL-safe, généré côté Prisma à l'insertion. |
| **`@updatedAt`** | Auto-mis-à-jour à chaque update, géré par Prisma (pas Postgres). |
| **`upsert`** | "update or insert" — pratique pour des seeds idempotents. |
| **`tsx` pour scripts TS** | Node n'exécute que du JS. `tsx` (basé sur esbuild) compile TS en mémoire à la volée. Plus rapide que `ts-node`. Indispensable pour seeds et scripts hors Next.js. |
| **Types Prisma 7** | Le nouveau générateur expose les types modèles avec le suffixe `Model` : pour le modèle `Workshop`, on importe `WorkshopModel` depuis `@/generated/prisma/models`. Les vieux tutos utilisent `Workshop` (Prisma 6 et antérieur) — ça ne marche plus. Astuce : `import type { WorkshopModel as Workshop }` pour garder le code lisible. |
| **Import client** | Idem, le point d'entrée est `@/generated/prisma/client` (avec `/client`), plus `@/generated/prisma` tout court — pas de barrel `index.ts`. |

---

## Concepts Next.js App Router appris

Vus en session 2 : routes dynamiques, filtres URL-driven, mutations via Server Actions.

### Routes dynamiques `[slug]` — Bloc 1

| Concept | Résumé |
|---|---|
| **Convention `[slug]`** | Un dossier nommé `[slug]` dans `app/` crée une route dynamique. L'URL `/ateliers/atelier-de-mor` → la valeur `"atelier-de-mor"` est capturée sous le nom du dossier. |
| **`params` est async (Next 15+)** | La prop reçue est `params: Promise<{ slug: string }>`. Toujours `const { slug } = await params;`. Idem pour `searchParams`. Les vieux tutos écrivent `params.slug` directement → ne compile plus. |
| **`findUnique` vs `findFirst`** | `findUnique` ne fonctionne que sur champs `@unique` ou `@id` ; plus rapide (arrêt dès la 1ʳᵉ ligne) ; retourne `null` si rien. À préférer dès qu'on cherche par un champ unique. |
| **`notFound()`** | Importé de `"next/navigation"`. Throw une exception spéciale → Next rend la page 404. Après `if (!x) notFound()`, TypeScript fait le narrowing automatique (`x` n'est plus `null`). |
| **`generateMetadata`** | Fonction exportée qui génère dynamiquement le `<title>` et la `<meta description>`. Appelée en parallèle du composant page. Next dédoublonne les requêtes Prisma identiques entre les deux. |
| **`<Link>` vs `<a>`** | `<Link>` de `next/link` = navigation client-side (pas de reload complet), preload au hover. À utiliser pour TOUS les liens internes. `<a>` uniquement pour les liens externes. |

### Filtres URL-driven — Bloc 2

| Concept | Résumé |
|---|---|
| **`searchParams` async** | `searchParams: Promise<{ key?: string }>` — accède via `await`. Captures la query string `?key=value`. |
| **URL = état** | Pour des filtres / tris / pagination, l'URL est l'état. Plus de `useState`, plus de client component. Chaque clic = un `<Link>` qui change l'URL = re-render Server Component. |
| **Avantages serveur** | Partageable, indexable (SEO), no-JS, scalable (10 ateliers ou 10 000 ne change rien — le `where` SQL reste rapide si indexé). |
| **`Promise.all`** | Paralléliser plusieurs queries Prisma indépendantes (`distinct neighborhoods` + `findMany filtré`). 2× les requêtes en 1× le temps. |
| **`where` conditionnel** | `where: x ? { field: x } : undefined` — pas de filtre si pas de param. `undefined` plus explicite que `{}`. |
| **`distinct: ["field"]`** | Génère un `SELECT DISTINCT` SQL. Utile pour récupérer les valeurs uniques d'une colonne (genre la liste des quartiers présents). |
| **`encodeURIComponent`** | Toujours encoder les valeurs dynamiques injectées dans un `href`. Le `é` devient `%C3%A9`, le `&` ne casse pas la query. Next décode automatiquement à la réception. |

### Mutations via Server Actions — Bloc 3

| Concept | Résumé |
|---|---|
| **`"use server"`** | Directive en tête de fichier → toutes les exports deviennent des Server Actions, exécutées sur le serveur, jamais bundlées côté client. Aussi possible inline dans une fonction. |
| **`<form action={action}>`** | Branchement direct, pas de `fetch`, pas d'API route. Next sérialise les champs, appelle l'action côté serveur, renvoie la réponse. Fonctionne même sans JS (progressive enhancement). |
| **`FormData`** | L'argument reçu. `formData.get("name")` retourne `string \| File \| null` → toujours `String(formData.get("name") ?? "").trim()` pour être safe. |
| **Validation serveur obligatoire** | `required` HTML5 = UX, jamais sécurité. Quelqu'un peut bypass via `curl` ou DevTools. Le serveur est l'autorité finale. |
| **`redirect(url)`** | De `"next/navigation"`. Throw une exception interne → tout ce qui est après est mort, à mettre TOUJOURS en dernier. Ne pas le mettre dans un try/catch. |
| **Erreurs via URL** | Pattern simple sans client component : `redirect(\`/admin?error=\${encodeURIComponent(msg)}\`)`, la page lit `searchParams.error` et l'affiche. Pour des erreurs riches → `useActionState` (client component). |
| **`revalidatePath(path)`** | De `"next/cache"`. Invalide le cache d'une route précise. Après une mutation, appeler pour chaque route qui affiche la donnée modifiée. |
| **`revalidatePath(path, "layout")`** | Variante "marteau" : invalide TOUT ce qui est sous ce layout. Pratique pour des changements transverses, gaspilleur sinon. |
| **`.bind(null, value)`** | Fige un argument fixe sur une Server Action. Exemple : `updateWorkshop.bind(null, workshop.id)` → l'id n'est pas dans le `<form>` visible. Next chiffre la valeur bound côté client → impossible à tampérer. |
| **`defaultValue` vs `value`** | `value` = input contrôlé (faut un `onChange`). `defaultValue` = non-contrôlé, le DOM gère. Pour les forms→Server Action, **toujours `defaultValue`** : pas de `useState`, pas de re-render, et le form reste un Server Component. |
| **`slugify` maison** | `toLowerCase()` → `normalize("NFD")` → strip diacritics → `[^a-z0-9]+` → `-`. "Sénégal Mobilier" → `senegal-mobilier`. URL stable, à ne plus modifier après création. |
| **Server Actions vs API REST** | Server Actions remplacent ~90% des API Routes pour le CRUD interne. API REST reste utile pour : apps mobiles tierces, webhooks, API publique, streaming. Les deux peuvent coexister. |
| **Server Actions vs Zustand** | Pas concurrents — complémentaires. Zustand = état temporaire client (config UI, panier, filtres clients). Server Actions = persistance DB. Pattern : Zustand pour interagir localement → Server Action pour persister. |
| **Heuristique de choix** | « Persisté » → Server Action. « Temporaire utilisateur » → Zustand. « Endpoint externe / mobile / webhook » → API REST. |

---

## Structure du projet (à ce stade)

```
teranga-annuaire/
├── prisma/
│   ├── schema.prisma                       ← modèles (Workshop pour l'instant)
│   ├── seed.ts                             ← 3 ateliers en dur
│   └── migrations/
│       └── 20260516134624_init_workshop/
│           └── migration.sql
├── prisma.config.ts                        ← config CLI Prisma (datasource + seed)
├── src/
│   ├── app/
│   │   ├── layout.tsx                      ← layout racine (lang="fr")
│   │   ├── page.tsx                        ← Home : liste + filtre quartier
│   │   ├── ateliers/
│   │   │   └── [slug]/page.tsx             ← Détail atelier (route dynamique)
│   │   └── admin/
│   │       ├── page.tsx                    ← Form add + liste
│   │       ├── actions.ts                  ← Server Actions createWorkshop + updateWorkshop
│   │       └── [slug]/edit/page.tsx        ← Form de modification
│   ├── components/
│   │   ├── WorkshopCard.tsx                ← Carte cliquable (home)
│   │   └── WorkshopForm.tsx                ← Form partagé create + edit
│   ├── generated/prisma/                   ← Client Prisma 7 (gitignored)
│   └── lib/
│       ├── prisma.ts                       ← Singleton PrismaClient + adapter pg
│       └── utils.ts                        ← getInitials, slugify
├── .env                                    ← DATABASE_URL + DIRECT_URL (gitignored)
├── NOTES.md                                ← ce fichier
└── ...
```