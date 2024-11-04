/*
  Warnings:

  - Added the required column `nome` to the `ImagemSatelite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImagemSatelite" ADD COLUMN     "nome" TEXT;
