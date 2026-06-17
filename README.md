# GitLab Access Audit

Nástroj pro kontrolu, kdo má přístup ke GitLab skupině a jejím podskupinám a projektům.
Zadáš ID top-level skupiny ve formuláři a dostaneš lidsky čitelný seznam uživatelů s jejich
rolemi ve skupinách a projektech, plus celkový počet.

## Stack

- **Next.js (App Router) + TypeScript** — formulář (client) + Route Handler (server).
- **TanStack Query** — stav dotazu na klientu.
- **Orval** — generuje typovaný GitLab klient (fetch funkce + TS typy) z `api.yaml`.
- **GitLab REST API** (ne GraphQL).

## Nastavení

```bash
npm install
cp .env.example .env.local   # a doplň token
npm run dev                  # http://localhost:3000
```

### Access token

Token se **nepředává jako argument**. Je uložen v `.env.local` jako server-only proměnná:

```
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

- Čte se **jen na serveru** (`process.env.GITLAB_TOKEN` v `src/api/mutator.ts`), takže se
  nikdy nedostane do prohlížeče (proto **bez** prefixu `NEXT_PUBLIC_`).
- **Vyměníš ho** editací jediné hodnoty v `.env.local` a restartem dev serveru.
- Pro self-hosted GitLab lze přepsat `GITLAB_BASE_URL` (výchozí `https://gitlab.com`).

## Jak to funguje

```
[Prohlížeč: formulář]  --useQuery-->  GET /api/access-report?groupId=  (server)
                                            │
                                            ├─ src/lib/aggregate.ts (orchestrátor)
                                            │    └─ Orval fetch funkce + pagination + concurrency
                                            └─> GitLab REST API  (token z process.env)
        <-- JSON { users, total } --
[Render lidsky čitelného výstupu + Total Users]
```

Agregace běží **na serveru** — Next.js Route Handler funguje jako proxy, takže odpadá CORS
i vystavení tokenu v klientu.

### Algoritmus (`src/lib/aggregate.ts`)

1. Načti top-level skupinu (`GET /groups/{id}`) — ověření přístupu + `full_path`.
2. Načti všechny potomky (`GET /groups/{id}/descendant_groups`) — libovolná hloubka, jeden sweep.
3. Pro každou skupinu (top + potomci): přímí členové + projekty skupiny.
4. Pro každý projekt: přímí členové.
5. Spoj podle uživatele → seznam `{ jméno, username, skupiny[], projekty[] }` + celkový počet.

Používají se **přímí** členové (`/members`, ne `/members/all`) — odpovídá ukázce v zadání, kde
uživatel bez členství ve skupině figuruje jen přes členství v projektech.

### Škálovatelnost

- Pagination: 100 položek/stránku, loopuje se přes hlavičku `x-next-page` (`src/lib/paginate.ts`).
- Concurrency limit (`p-limit`, 8 souběžných requestů) kvůli ~500 projektům na reálném prostředí.

## Generování GitLab klienta (Orval)

`api.yaml` je kompletní GitLab REST spec (3 MB). `npm run gen` ho přes
`scripts/orval-transformer.cjs` prořeže na 5 potřebných endpointů (+ jen dosažitelná schémata)
a vygeneruje typovaný fetch klient do `src/api/generated/`. Spusť po změně `api.yaml`.

> Orval generuje **fetch funkce + typy**, ne React Query hooky — agregace běží na serveru, kde
> hooky použít nejde. TanStack Query se používá na klientu pro náš jeden endpoint.

## Skripty

| Příkaz | Popis |
|---|---|
| `npm run dev` | Dev server na `localhost:3000` |
| `npm run gen` | Regeneruj GitLab klient z `api.yaml` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit testy (Vitest) |
| `npm run build` / `npm start` | Produkční build / běh |

## Testovací prostředí

ID skupiny `10975505` (read-only token v zadání). Očekávaný výstup: 5 uživatelů, `Total Users: 5`.
