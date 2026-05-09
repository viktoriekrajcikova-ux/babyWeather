# Supabase migrations

DB schema changes pro projekt `ashilhuaxwjvavxoehbs`.

## Konvence

- Soubory v `migrations/` jsou pojmenované `YYYYMMDDHHMMSS_<popis>.sql`
- Každá migrace je idempotentní (`if not exists`, `or replace`) tam, kde to dává smysl
- Zatím spouštěné ručně v Supabase SQL Editoru (Dashboard → SQL Editor → New query → paste → Run)
- Po každé migraci commit do gitu — schema je verzovaný spolu s kódem

## Proč soubory, když Supabase má dashboard

Aby DB schema bylo **infrastructure as code**:
- Code review pokrývá i DB změny
- Historii dohledáš v `git log`, ne v dashboardu
- Setup nového prostředí = projít migrace v pořadí, ne klikat v UI

## Budoucí krok

Až bude víc migrací, přejít na [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase db push`) — pak se migrace aplikují automaticky a CI je může spouštět proti staging DB.
