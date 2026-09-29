const fs = require('fs');
const path = require('path');

const tsContent = fs.readFileSync(path.resolve(__dirname, '../src/data/checklistMaster.ts'), 'utf8');
const jsonStr = tsContent.substring(tsContent.indexOf('MASTER_AREAS: Area[] = ') + 'MASTER_AREAS: Area[] = '.length, tsContent.indexOf(';\n\nexport const CHECKPOINT_SLOTS'));
const MASTER_AREAS = JSON.parse(jsonStr);

const sectionValues = [];
const itemValues = [];

for (const area of MASTER_AREAS) {
  for (const section of area.sections) {
    sectionValues.push(`('${section.id}', '${area.id}', '${section.code}', '${section.name.replace(/'/g, "''")}', ${section.code.charCodeAt(0)})`);
    for (const item of section.items) {
      itemValues.push(`('${item.id}', '${section.id}', '${item.code}', '${item.text.replace(/'/g, "''")}', '${item.frequency}', ${item.weight}, ${item.is_key_item}, ${item.require_photo}, ${item.is_supply}, TRUE, 0)`);
    }
  }
}

const secQuery = `INSERT INTO sections (id, area_id, code, name, display_order) VALUES \n` + sectionValues.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n\n`;
const itemQuery = `INSERT INTO items (id, section_id, code, text, frequency, weight, is_key_item, require_photo, is_supply, is_active, display_order) VALUES \n` + itemValues.join(',\n') + `\nON CONFLICT (id) DO NOTHING;\n`;

fs.writeFileSync(path.resolve(__dirname, 'seed.sql'), secQuery + itemQuery);
console.log('Wrote scripts/seed.sql');
