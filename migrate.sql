-- CreateTable
CREATE TABLE "fee_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "academicSessionId" TEXT NOT NULL,
    "classId" TEXT,
    "sectionId" TEXT,
    "feeCategoryId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "dueDate" DATETIME,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fee_structures_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fee_structures_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fee_structures_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fee_structures_feeCategoryId_fkey" FOREIGN KEY ("feeCategoryId") REFERENCES "fee_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fee_structures_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "originalAmount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_fees_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_fees_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_fees_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentFeeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "transactionReference" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "receivedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fee_payments_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "student_fees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fee_payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fee_payments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "late_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentFeeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL,
    "percentage" REAL,
    "reason" TEXT,
    "appliedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "waivedById" TEXT,
    "waivedAt" DATETIME,
    "waiverReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "late_fees_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "student_fees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "late_fees_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "late_fees_waivedById_fkey" FOREIGN KEY ("waivedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_discounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentFeeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fee_discounts_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "student_fees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fee_discounts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fee_discounts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "fee_categories_name_key" ON "fee_categories"("name");

-- CreateIndex
CREATE INDEX "fee_structures_academicSessionId_idx" ON "fee_structures"("academicSessionId");

-- CreateIndex
CREATE INDEX "fee_structures_classId_idx" ON "fee_structures"("classId");

-- CreateIndex
CREATE INDEX "fee_structures_feeCategoryId_idx" ON "fee_structures"("feeCategoryId");

-- CreateIndex
CREATE INDEX "student_fees_studentId_idx" ON "student_fees"("studentId");

-- CreateIndex
CREATE INDEX "student_fees_feeStructureId_idx" ON "student_fees"("feeStructureId");

-- CreateIndex
CREATE INDEX "student_fees_academicSessionId_idx" ON "student_fees"("academicSessionId");

-- CreateIndex
CREATE INDEX "student_fees_status_idx" ON "student_fees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_receiptNumber_key" ON "fee_payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "fee_payments_studentFeeId_idx" ON "fee_payments"("studentFeeId");

-- CreateIndex
CREATE INDEX "fee_payments_studentId_idx" ON "fee_payments"("studentId");

-- CreateIndex
CREATE INDEX "fee_payments_receiptNumber_idx" ON "fee_payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "late_fees_studentFeeId_idx" ON "late_fees"("studentFeeId");

-- CreateIndex
CREATE INDEX "fee_discounts_studentFeeId_idx" ON "fee_discounts"("studentFeeId");

