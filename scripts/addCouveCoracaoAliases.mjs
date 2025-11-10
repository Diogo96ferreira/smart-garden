import fs from 'node:fs';

const PT_PATH = 'public/calendario.pt.json';
const EN_PATH = 'public/calendario.en.json';

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function cloneIfExists(obj, fromKey, toKey) {
  if (obj[fromKey] && !obj[toKey]) obj[toKey] = obj[fromKey];
}

// PT: add display aliases under each ZONA
const pt = readJson(PT_PATH);
if (pt && pt.calendario) {
  for (const zona of Object.keys(pt.calendario)) {
    const cal = pt.calendario[zona];
    cloneIfExists(cal, 'Couve lombarda', 'Couve Coração - Lombarda');
    cloneIfExists(cal, 'Couve galega (tronchuda)', 'Couve Coração - Galega');
  }
  writeJson(PT_PATH, pt);
  console.log('Updated', PT_PATH);
}

// EN: add display aliases based on existing English crop names
// Use readable English while keeping relation clear
const en = readJson(EN_PATH);
if (en && en.calendar) {
  for (const zone of Object.keys(en.calendar)) {
    const cal = en.calendar[zone];
    cloneIfExists(cal, 'Savoy cabbage', 'Heart cabbage - Savoy');
    cloneIfExists(cal, 'Portuguese cabbage (tronchuda)', 'Heart cabbage - Portuguese (tronchuda)');
  }
  writeJson(EN_PATH, en);
  console.log('Updated', EN_PATH);
}

