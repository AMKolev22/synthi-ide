/*
  Warnings:

  - You are about to drop the `WorkspaceItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WorkspaceItem" DROP CONSTRAINT "WorkspaceItem_parentId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceItem" DROP CONSTRAINT "WorkspaceItem_workspaceId_fkey";

-- DropTable
DROP TABLE "WorkspaceItem";
