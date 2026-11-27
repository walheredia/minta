-- DropForeignKey
ALTER TABLE `Expense` DROP FOREIGN KEY `Expense_systemCategoryId_fkey`;

-- DropIndex
DROP INDEX `Expense_systemCategoryId_fkey` ON `Expense`;

-- AlterTable
ALTER TABLE `Expense` ADD COLUMN `householdCategoryId` VARCHAR(191) NULL,
    MODIFY `systemCategoryId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `HouseholdExpenseCategory` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `normalizedKey` VARCHAR(40) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HouseholdExpenseCategory_householdId_normalizedKey_key`(`householdId`, `normalizedKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HouseholdExpenseCategory` ADD CONSTRAINT `HouseholdExpenseCategory_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdExpenseCategory` ADD CONSTRAINT `HouseholdExpenseCategory_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_systemCategoryId_fkey` FOREIGN KEY (`systemCategoryId`) REFERENCES `SystemExpenseCategory`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_householdCategoryId_fkey` FOREIGN KEY (`householdCategoryId`) REFERENCES `HouseholdExpenseCategory`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Every Expense is classified under exactly one Expense Category (ADR 0004).
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_exactly_one_category_check` CHECK ((`systemCategoryId` IS NULL) <> (`householdCategoryId` IS NULL));
