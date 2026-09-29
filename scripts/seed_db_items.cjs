const fs = require('fs');
const path = require('path');
const http = require('http');

// Extract MASTER_AREAS from src/data/checklistMaster.ts
const tsContent = fs.readFileSync(path.resolve(__dirname, '../src/data/checklistMaster.ts'), 'utf8');
const jsonStr = tsContent.substring(tsContent.indexOf('MASTER_AREAS: Area[] = ') + 'MASTER_AREAS: Area[] = '.length, tsContent.indexOf(';\n\nexport const CHECKPOINT_SLOTS'));
const MASTER_AREAS = JSON.parse(jsonStr);

async function seed() {
  console.log('Seeding sections and items to Insforge...');
  
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

  // Insert sections
  const secQuery = `INSERT INTO sections (id, area_id, code, name, display_order) VALUES \n` + sectionValues.join(',\n') + `\nON CONFLICT (id) DO NOTHING;`;
  await runSql(secQuery);
  console.log(`Inserted ${sectionValues.length} sections.`);

  // Insert items in chunks of 50 to avoid query size limits
  const chunkSize = 50;
  for (let i = 0; i < itemValues.length; i += chunkSize) {
    const chunk = itemValues.slice(i, i + chunkSize);
    const itemQuery = `INSERT INTO items (id, section_id, code, text, frequency, weight, is_key_item, require_photo, is_supply, is_active, display_order) VALUES \n` + chunk.join(',\n') + `\nON CONFLICT (id) DO NOTHING;`;
    await runSql(itemQuery);
    console.log(`Inserted items ${i + 1} to ${Math.min(i + chunkSize, itemValues.length)}.`);
  }

  console.log('Finished seeding all sections and items to database!');
}

function runSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const req = http.request({
      hostname: '43.157.228.75',
      port: 7130,
      path: '/api/database/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer anon_0a75c32f9a5fa623748cae8ca28764bf213bc112',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ body, statusCode: res.statusCode });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

seed().catch(console.error);
