/*
  Warnings:

  - You are about to drop the column `data_download` on the `ImagemSatelite` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `ImagemSatelite` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `ImagemSatelite` table. All the data in the column will be lost.
  - Added the required column `coordenada_leste` to the `ImagemSatelite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coordenada_norte` to the `ImagemSatelite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coordenada_oeste` to the `ImagemSatelite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coordenada_sul` to the `ImagemSatelite` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ImagemSatelite" DROP CONSTRAINT "ImagemSatelite_usuario_id_fkey";

-- AlterTable
ALTER TABLE "ImagemSatelite" DROP COLUMN "data_download",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "cloudPercentage" DOUBLE PRECISION,
ADD COLUMN     "coordenada_leste" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coordenada_norte" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coordenada_oeste" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "coordenada_sul" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "shadowPercentage" DOUBLE PRECISION,
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "data_imagem" SET DEFAULT CURRENT_TIMESTAMP;
