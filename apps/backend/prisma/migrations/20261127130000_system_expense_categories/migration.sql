-- Existing Expenses are test data with free-text descriptions; they are discarded.
DELETE FROM `Expense`;

-- AlterTable
ALTER TABLE `Expense` DROP COLUMN `description`,
    ADD COLUMN `detail` VARCHAR(200) NULL,
    ADD COLUMN `systemCategoryId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `SystemExpenseCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `normalizedKey` VARCHAR(40) NOT NULL,
    `groupName` VARCHAR(40) NOT NULL,

    UNIQUE INDEX `SystemExpenseCategory_normalizedKey_key`(`normalizedKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_systemCategoryId_fkey` FOREIGN KEY (`systemCategoryId`) REFERENCES `SystemExpenseCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

