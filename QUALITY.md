# Simulation quality

Use the [criteria catalog](quality/CRITERIA.md), [latest assessment](quality/evidence/2026/11/2026-11-14-baseline.md), and [human assessment procedure](quality/HUMAN-PROCEDURE.md). Compare the simulation with what a typical person expects in a similar real setting.

## Next milestone

Address WORLD-01 (physical behavior). Use one rule to release the cup over the table, stand, and floor. Verify that the cup settles on each surface, stays there when the player returns, and can be picked up again. Repeat the original cup task and reset checks.

## Record management

Keep this index short. Add dated evidence records under quality/evidence, grouped by year and month. Include criterion IDs, criteria revision, tested build, test conditions, results, and limits. Update the latest assessment link. Keep historical results in their dated records.

At 10,000 updates, group records by day if month folders become crowded. Add a generated lookup by criterion ID, date, and tested build when direct lookup becomes slow. At 1,000,000 updates, use an indexed store for evidence and generate the current summary from it. Preserve IDs and history when moving records. Check lookup time, update cost, and whether counts and links survive a migration. Adopt a larger system when measured cost justifies it.
