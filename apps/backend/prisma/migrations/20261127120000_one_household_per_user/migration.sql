-- A User belongs to exactly one Household (ADR 0005).

-- Give the householdId FK its own index before dropping the composite unique it relied on.
CREATE INDEX `HouseholdMember_householdId_idx` ON `HouseholdMember`(`householdId`);
DROP INDEX `HouseholdMember_householdId_userId_key` ON `HouseholdMember`;
CREATE UNIQUE INDEX `HouseholdMember_userId_key` ON `HouseholdMember`(`userId`);

-- Backfill a one-person Household for every existing User without one.
INSERT INTO `Household` (`id`, `name`, `createdAt`, `updatedAt`)
SELECT CONCAT('hh_', u.`id`),
       COALESCE(CONCAT('Hogar de ', NULLIF(TRIM(u.`name`), '')), 'Mi Hogar'),
       CURRENT_TIMESTAMP(3),
       CURRENT_TIMESTAMP(3)
FROM `User` u
WHERE NOT EXISTS (SELECT 1 FROM `HouseholdMember` m WHERE m.`userId` = u.`id`);

INSERT INTO `HouseholdMember` (`id`, `householdId`, `userId`, `joinedAt`)
SELECT CONCAT('hm_', u.`id`), CONCAT('hh_', u.`id`), u.`id`, CURRENT_TIMESTAMP(3)
FROM `User` u
WHERE NOT EXISTS (SELECT 1 FROM `HouseholdMember` m WHERE m.`userId` = u.`id`);
