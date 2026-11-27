# 01: Every User gets a one-person Household

**What to build:** Every User belongs to exactly one Household (ADR 0005). Registering creates the User and a one-person Household ("Hogar de {name}", or "Mi Hogar" when the User has no name) atomically. A migration backfills a Household for every existing User, and Household membership becomes unique per User. Backend only: there is no Household UI yet.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Registering a User creates a Household with that User as its only member, in the same transaction
- [ ] Household name is "Hogar de {name}" or "Mi Hogar" when no name was given
- [ ] Migration backfills a Household for every existing User without one
- [ ] A User cannot belong to more than one Household (enforced in the database)
- [ ] Covered by e2e tests at the HTTP boundary (register → household exists)
