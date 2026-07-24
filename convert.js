const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Change provider to sqlite
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');

// 2. Remove @db.Date
schema = schema.replace(/@db\.Date/g, '');

// 3. Extract all enums and remove them
const enumRegex = /enum\s+(\w+)\s+{[\s\S]*?}/g;
let match;
const enums = [];
while ((match = enumRegex.exec(schema)) !== null) {
  enums.push(match[1]);
}
schema = schema.replace(enumRegex, '');

// 4. Replace enum types with String in models
enums.forEach(enumName => {
  // Regex to match FieldName EnumName ...
  const fieldRegex = new RegExp(`(\\w+)\\s+${enumName}(\\?)?(\\s|$)`, 'g');
  schema = schema.replace(fieldRegex, `$1 String$2$3`);
  
  // also replace array of enums (if any)
  const arrayRegex = new RegExp(`(\\w+)\\s+${enumName}\\[\\](\\s|$)`, 'g');
  schema = schema.replace(arrayRegex, `$1 String$2`); // Note: SQLite doesn't support arrays, so we map to String if any
});

// 5. Replace Json with String (SQLite Prisma doesn't natively support Json type, wait, let's leave Json and see. Actually let's just change Json to String to be safe).
// Wait, Prisma added SQLite JSON support in v5. Let's keep Json? No, Prisma doesn't support Json in SQLite. We must change Json to String.
// Actually, let's see. `Json?` -> `String?`
schema = schema.replace(/(\w+)\s+Json\?/g, '$1 String?');
schema = schema.replace(/(\w+)\s+Json/g, '$1 String');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema converted to SQLite');
