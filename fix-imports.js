const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  "src/types/next-auth.d.ts",
  "src/middleware.ts",
  "src/lib/permissions/authorization.ts",
  "src/lib/auth/session.ts",
  "src/lib/auth/auth.ts",
  "src/lib/audit/audit-log.ts",
  "src/components/admin/admin-topbar.tsx",
  "src/components/admin/admin-sidebar.tsx",
  "src/components/admin/admin-recent-activity.tsx",
  "src/actions/students/student-actions.ts"
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace imports like: import type { Role } from "@prisma/client";
  // with: import type { Role } from "@/types/enums";
  content = content.replace(/import type { ([^}]+) } from "@prisma\/client";/g, (match, types) => {
    // AuditLog has a special case: import { Prisma } from "@prisma/client" shouldn't match if it uses `import type`
    return `import type { ${types} } from "@/types/enums";`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Imports updated successfully");
