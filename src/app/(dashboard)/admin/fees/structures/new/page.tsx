import { requireRole } from "@/lib/auth/session";
import { prisma as db } from "@/lib/db/prisma";
import { FeeStructureForm } from "@/components/fees/fee-structure-form";

export const metadata = {
  title: "New Fee Structure | EduManage",
};

export default async function NewFeeStructurePage() {
  await requireRole("ADMIN");

  const [categories, sessions, classes] = await Promise.all([
    db.feeCategory.findMany({ where: { isActive: true } }),
    db.academicSession.findMany({ orderBy: { startDate: "desc" } }),
    db.class.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Fee Structure</h2>
        <p className="text-muted-foreground mt-1">
          Create a new fee configuration to assign to students.
        </p>
      </div>
      
      <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm">
        <FeeStructureForm 
          categories={categories} 
          sessions={sessions} 
          classes={classes} 
        />
      </div>
    </div>
  );
}
