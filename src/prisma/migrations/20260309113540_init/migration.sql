-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'DE',
    "reportingYear" INTEGER NOT NULL,
    "orgBoundary" TEXT NOT NULL DEFAULT 'operational_control'
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "publicFormToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope1Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "valueTco2e" REAL NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "emissionFactorsSource" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "assumptions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scope1Record_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope2Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "valueTco2e" REAL NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "emissionFactorsSource" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "assumptions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scope2Record_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scope3Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material" BOOLEAN NOT NULL DEFAULT false,
    "materialityReason" TEXT
);

-- CreateTable
CREATE TABLE "Scope3Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "supplierId" TEXT,
    "categoryId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "valueTco2e" REAL NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "emissionFactorSource" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "assumptions" TEXT,
    "confidence" REAL NOT NULL,
    "activityDataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scope3Record_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Scope3Record_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Scope3Record_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Scope3Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MethodologyNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MethodologyNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditTrailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    CONSTRAINT "AuditTrailEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_publicFormToken_key" ON "Supplier"("publicFormToken");

-- CreateIndex
CREATE UNIQUE INDEX "Scope3Category_code_key" ON "Scope3Category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MethodologyNote_companyId_scope_key" ON "MethodologyNote"("companyId", "scope");
