# Minta

Personal and household finance tracking for the Argentine market: expense control and analysis first, with income tracking, shared household expenses, and (later) investment/asset monitoring.

## Language

**User**:
An individual person with an account in Minta.
_Avoid_: Account, member (on its own)

**Household**:
A group of one or more **User**s who share visibility into each other's **Shared Expense**s. Shown to end users as "Hogar".
_Avoid_: Family, group

**Expense**:
A recorded cash outflow by a **User**, kept in whichever **Currency** it actually occurred in. Every Expense is either a **Personal Expense** (visible only to the **User** who recorded it) or a **Shared Expense** (visible to every member of the **User**'s **Household**). Shown to end users as "Gasto".
_Avoid_: Transaction, purchase

**Currency**:
The denomination an **Expense** (or **Income**) actually moved in: ARS or USD. Reflects what really left the **User**'s pocket (e.g. a USD-denominated subscription charged to an ARS card is an ARS Expense; one paid from USD savings is a USD Expense) — never a derived or converted value. Totals are kept separate per Currency; nothing is auto-converted or summed across currencies.

**Reference Exchange Rate**:
A rate the **User** configures manually (official/blue/tarjeta, plus the impuesto PAIS percentage) used only to *display* an estimated ARS-equivalent next to USD **Expense** totals. Never stored on or used to compute the **Expense** itself.

**Personal Expense**:
An **Expense** visible only to the **User** who recorded it, not shared with their **Household**.

**Shared Expense**:
An **Expense** visible to every member of the recording **User**'s **Household**. Does not track per-member splits or debts between members.
_Avoid_: Split expense (no splitting/debt logic exists)
