const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace @default(VAR) with @default("VAR") where VAR is all uppercase (like enums)
// e.g. @default(ACTIVE) -> @default("ACTIVE")
schema = schema.replace(/@default\(([A-Z_]+)\)/g, '@default("$1")');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Fixed string defaults');
