# 04: Catalog sync merges Household duplicates

**What to build:** When the catalog sync adds a System Category whose normalized key matches an existing Household Category, the Household Category's Expenses are reassigned to the System Category and the Household Category is deleted, all in one transaction. This preserves the invariant that no two categories visible to a Household share a normalized name (ADR 0004).

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Sync merges matching Household Categories into the System Category and reassigns their Expenses
- [ ] Running the sync twice changes nothing the second time
- [ ] Verified against the real database in the e2e suite
