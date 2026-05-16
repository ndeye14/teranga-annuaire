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
- **Déploiement** : Vercel (à venir)

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
| **Client généré** | Code TypeScript dans `src/generated/prisma/`, regénéré à chaque `prisma generate`. **Non commit** (dans `.gitignore`) |
| **Singleton** | Pattern `globalThis` pour éviter les doublons de `PrismaClient` en dev (HMR) |
| **`@unique`** | Contrainte SQL d'unicité, permet `findUnique({ where: { slug } })` |
| **`String[]`** | Array natif Postgres, parfait pour des listes courtes sans table de jointure |
| **`@default(cuid())`** | ID court, URL-safe, généré côté Prisma à l'insertion |
| **`@updatedAt`** | Auto-mis-à-jour à chaque update, géré par Prisma (pas Postgres) |
| **`upsert`** | "update or insert" — pratique pour des seeds idempotents |
| **Types Prisma 7** | Le nouveau générateur expose les types modèles avec le suffixe `Model` : pour le modèle `Workshop`, on importe `WorkshopModel` depuis `@/generated/prisma/models`. Les vieux tutos utilisent `Workshop` (Prisma 6 et antérieur) — ça ne marche plus. Astuce : `import type { WorkshopModel as Workshop }` pour garder le code lisible. |
| **Import client** | Idem, le point d'entrée est `@/generated/prisma/client` (avec `/client`), plus `@/generated/prisma` tout court — pas de barrel `index.ts`. |

---

## Structure du projet (à ce stade)

```
teranga-annuaire/
├── prisma/
│   ├── schema.prisma           ← modèles (Workshop pour l'instant)
│   ├── seed.ts                 ← 3 ateliers en dur
│   └── migrations/
│       └── 20260516134624_init_workshop/
│           └── migration.sql
├── prisma.config.ts            ← config CLI Prisma (datasource + seed)
├── src/
│   ├── app/                    ← App Router
│   ├── generated/prisma/       ← client Prisma (gitignored)
│   └── lib/
│       └── prisma.ts           ← singleton PrismaClient
├── .env                        ← DATABASE_URL + DIRECT_URL (gitignored)
└── ...
```
