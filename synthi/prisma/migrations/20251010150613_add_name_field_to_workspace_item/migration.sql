/*
  Warnings:

  - Added the required column `name` to the `WorkspaceItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkspaceItem" ADD COLUMN     "name" TEXT NOT NULL;
