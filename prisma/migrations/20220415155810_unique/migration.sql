/*
  Warnings:

  - A unique constraint covering the columns `[accountId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Chat_accountId_key` ON `Chat`(`accountId`);
