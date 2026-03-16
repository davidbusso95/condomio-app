-- Change Currency enum from VES to ARS
ALTER TYPE "Currency" ADD VALUE 'ARS';
ALTER TYPE "Currency" RENAME VALUE 'VES' TO 'ARS';
