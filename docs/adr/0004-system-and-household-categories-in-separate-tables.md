# System and Household Categories live in separate tables

**System Category**s (predefined by Minta, read-only for users) and **Household Category**s (created by a Household's members) are stored in two physically separate tables rather than one table with a nullable `householdId`. An **Expense** references its **Expense Category** through two mutually exclusive foreign keys — exactly one is set. We accepted the extra join/union and the "exactly one FK" invariant in exchange for isolation: a missing `householdId` filter can never leak one Household's categories to another or let users mutate the system catalog, and the system catalog can be reseeded independently.

## Consequences

- Category search unions both tables, scoped server-side to the requesting User's Household.
- No two categories visible to the same Household may share a normalized name (case- and accent-insensitive). This is a standing invariant: when a new System Category is added, any Household Category with the same normalized name is merged into it and its Expenses are reassigned.
