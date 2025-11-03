import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(filePath, obj) {
  const out = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, out, 'utf8');
}

function stripDiacritics(str) {
  if (!str) return str;
  // remove replacement chars and diacritics
  return str
    .replace(/\uFFFD/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normKey(str) {
  return stripDiacritics(String(str)).toLowerCase().trim();
}

function translateMonth(pt) {
  const s = normKey(pt);
  if (!s) return pt;
  if (/^jan/.test(s) || s.includes('janeiro')) return 'January';
  if (/^fev/.test(s) || s.includes('fevereiro')) return 'February';
  // match mar(ço) or corrupted forms like "maro"
  if ((/^mar/.test(s) && !/^mai/.test(s)) || s.includes('marco') || s === 'maro') return 'March';
  if (/^abr/.test(s) || s.includes('abril')) return 'April';
  if (/^mai/.test(s) || s.includes('maio')) return 'May';
  if (s.startsWith('junho') || s === 'jun' || /^junh?/.test(s)) return 'June';
  if (s.startsWith('julho') || s === 'jul' || /^julh?/.test(s)) return 'July';
  if (/^ago/.test(s) || s.includes('agosto')) return 'August';
  if (/^set/.test(s) || s.includes('setembro')) return 'September';
  if (/^out/.test(s) || s.includes('outubro')) return 'October';
  if (/^nov/.test(s) || s.includes('novembro')) return 'November';
  if (/^dez/.test(s) || s.includes('dezembro')) return 'December';
  return pt; // fallback
}

function translateStageKey(ptKey) {
  const k = normKey(ptKey);
  if (k === 'semeadura') return 'Sowing';
  if (k === 'transplante') return 'Transplant';
  if (k === 'colheita') return 'Harvest';
  return ptKey;
}

const districtMap = new Map([
  ['lisboa', 'Lisbon'],
  ['santarem', 'Santarem'],
  ['setubal', 'Setubal'],
  ['evora', 'Evora'],
  ['acores', 'Azores'],
]);

function translateDistrict(pt) {
  if (!pt) return pt;
  let name = pt;
  // Replace qualifiers
  name = name.replace(/\(faixa costeira\)/i, '(coastal)');
  name = name.replace(/\(interior\)/i, '(inland)');
  const base = name.replace(/\s*\(.*\)\s*$/, '').trim();
  const qualifier = (name.match(/\(.*\)/) || [''])[0];
  const baseNorm = normKey(base);
  const mapped =
    districtMap.get(baseNorm) ||
    base
      // keep ASCII for simple safety on some names
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  return qualifier ? `${mapped} ${qualifier}`.trim() : mapped;
}

const cropMap = new Map([
  ['abobora esparguete', 'Spaghetti squash'],
  ['abobora hokkaido', 'Hokkaido squash'],
  ['abobora manteiga (butternut)', 'Butternut squash'],
  ['abobora menina', 'Menina squash'],
  ['abacateiro (sul)', 'Avocado tree (south)'],
  ['acelga', 'Swiss chard'],
  ['agriao', 'Watercress'],
  ['aipo (aipo-cheiro)', 'Celery (stalk)'],
  ['aipo-rabano (celeri-rave)', 'Celeriac (celery root)'],
  ['aji amarillo', 'Aji Amarillo'],
  ['aji cristal', 'Aji Cristal'],
  ['aji lemon drop', 'Aji Lemon Drop'],
  ['alcachofra', 'Artichoke'],
  ['alecrim (mudas)', 'Rosemary (seedlings)'],
  ['alface folha de carvalho', 'Oak leaf lettuce'],
  ['alface iceberg', 'Iceberg lettuce'],
  ['alface repolho', 'Butterhead lettuce'],
  ['alface romana', 'Romaine lettuce'],
  ['alho', 'Garlic'],
  ['alho-frances', 'Leek'],
  ['ameixeira', 'Plum tree'],
  ['amendoeira', 'Almond tree'],
  ['amora (silvestre/cultivar)', 'Blackberry (wild/cultivar)'],
  ['anaheim', 'Anaheim pepper'],
  ['ancho (poblano seco)', 'Ancho (dried poblano)'],
  ['arroz (canteiro inundado)', 'Rice (flooded bed)'],
  ['aveia (horta)', 'Oat (garden)'],
  ['aveleira (avela)', 'Hazelnut tree (hazelnut)'],
  ['azedinha (sorrel)', 'Sorrel'],
  ['bananeira (ilhas)', 'Banana plant (islands)'],
  ['batata', 'Potato'],
  ['batata-doce', 'Sweet potato'],
  ['beldroega', 'Purslane'],
  ['beringela', 'Eggplant'],
  ['beterraba', 'Beet'],
  ['bhut jolokia (ghost pepper)', 'Bhut Jolokia (Ghost Pepper)'],
  ['brocolos', 'Broccoli'],
  ['canonigos', "Mache (lamb's lettuce)"],
  ['cardo', 'Cardoon'],
  ['carolina reaper', 'Carolina Reaper'],
  ['castanheiro', 'Chestnut tree'],
  ['cayenne (malagueta longa)', 'Cayenne (long hot pepper)'],
  ['cebola branca', 'White onion'],
  ['cebola roxa', 'Red onion'],
  ['cebolinho', 'Chives'],
  ['cebolinho-alho (alho-nira)', 'Garlic chives (nira)'],
  ['cenoura', 'Carrot'],
  ['centeio (horta)', 'Rye (garden)'],
  ['cerejeira', 'Cherry tree'],
  ['cevada (horta)', 'Barley (garden)'],
  ['chalota', 'Shallot'],
  ['chicoria', 'Chicory'],
  ['chipotle (jalapeno fumado)', 'Chipotle (smoked jalapeño)'],
  ['chuchu (sechium)', 'Chayote (sechium)'],
  ['citrinos (laranjeira/tangerineira/limoeiro)', 'Citrus (orange/mandarin/lemon)'],
  ['coentros', 'Cilantro'],
  ['couve chinesa (pe-tsai)', 'Chinese cabbage (pe-tsai)'],
  ['couve de bruxelas', 'Brussels sprouts'],
  ['couve galega (tronchuda)', 'Portuguese cabbage (tronchuda)'],
  ['couve lombarda', 'Savoy cabbage'],
  ['couve roxa', 'Red cabbage'],
  ['couve-flor', 'Cauliflower'],
  ['cumari (do para)', 'Cumari (Brazil)'],
  ['curgete', 'Zucchini'],
  ['diospiro roxo (var.)', 'Purple persimmon (var.)'],
  ['diospiro', 'Persimmon'],
  ['endivia/escarola', 'Endive/Escarole'],
  ['ervilha', 'Pea'],
  ['ervilha torta (mangetout)', 'Snow pea (mangetout)'],
  ['espargo (garras)', 'Asparagus (crowns)'],
  ["espelette (piment d'espelette)", 'Espelette pepper'],
  ['fava', 'Fava bean'],
  ['feijao trepador', 'Pole bean'],
  ['feijao verde (vagem)', 'Green bean (snap)'],
  ['figueira', 'Fig tree'],
  ['fisalis (physalis/cape gooseberry)', 'Physalis (cape gooseberry)'],
  ['framboesa', 'Raspberry'],
  ['funcho (bolbo)', 'Fennel (bulb)'],
  ['grao-de-bico', 'Chickpea'],
  ['groselha', 'Currant'],
  ['guajillo (mirasol seco)', 'Guajillo (dried mirasol)'],
  ['habanero chocolate', 'Chocolate habanero'],
  ['habanero laranja', 'Orange habanero'],
  ['hortela (mudas)', 'Mint (seedlings)'],
  ['hungarian wax (banana pepper)', 'Hungarian Wax (banana pepper)'],
  ['jalapeno', 'Jalapeño'],
  ['kiwi (gold/verde)', 'Kiwi (gold/green)'],
  ['kiwi hardy (actinidia arguta)', 'Hardy kiwi (actinidia arguta)'],
  ['kiwi pepino (pepino-doce)', 'Pepino melon (melon pear)'],
  ['lentilha', 'Lentil'],
  ['loureiro (mudas)', 'Bay laurel (seedlings)'],
  ['macieira (gala/fuji)', 'Apple tree (Gala/Fuji)'],
  ['malagueta portuguesa', 'Portuguese malagueta pepper'],
  ['manga (sul)', 'Mango (south)'],
  ['manjericao', 'Basil'],
  ['maracuja (sul/ilhas)', 'Passion fruit (south/islands)'],
  ['maracuja-roxo (trepadeira)', 'Purple passion fruit (vine)'],
  ['marmeleiro', 'Quince tree'],
  ['medronheiro', 'Strawberry tree (Arbutus)'],
  ['melao', 'Melon'],
  ['melancia', 'Watermelon'],
  ['milhete (milho-painco)', 'Millet (proso millet)'],
  ['milho doce', 'Sweet corn'],
  ['mirtilo', 'Blueberry'],
  ['morango', 'Strawberry'],
  ['nabo', 'Turnip'],
  ['nespereira', 'Loquat tree'],
  ['new mexico (hatch)', 'Hatch chile (New Mexico)'],
  ['nogueira (noz)', 'Walnut tree'],
  ['oliveira (azeitona)', 'Olive tree'],
  ['oregaos (mudas)', 'Oregano (seedlings)'],
  ['pak choi', 'Pak choi (bok choy)'],
  ['papaieira (ilhas)', 'Papaya tree (islands)'],
  ['pasilla (chilaca seco)', 'Pasilla (dried chilaca)'],
  ['pastinaca (parsnip)', 'Parsnip'],
  ['peperoncini', 'Peperoncini'],
  ['pepino', 'Cucumber'],
  ['pepino limao', 'Lemon cucumber'],
  ['pereira (inclui nashi)', 'Pear tree (incl. Asian pear)'],
  ['pessegueiro/nectarina', 'Peach/Nectarine tree'],
  ['pimenta biquinho', 'Biquinho pepper'],
  ['pimenta-de-cheiro', 'Brazilian fragrant pepper'],
  ['pimento', 'Bell pepper'],
  ['pimento (doce) italiano', 'Italian sweet pepper'],
  ['pimento california wonder', 'California Wonder bell pepper'],
  ['pimento padron', 'Padrón pepper'],
  ['piri-piri (malagueta)', "Piri-piri (bird's eye chile)"],
  ['pistacio', 'Pistachio'],
  ['poblano', 'Poblano'],
  ['quiabo', 'Okra'],
  ['quinoa', 'Quinoa'],
  ['rabanete', 'Radish'],
  ['rabanete japones', 'Daikon radish'],
  ['radicchio', 'Radicchio'],
  ['rucula', 'Arugula'],
  ['romazeira', 'Pomegranate tree'],
  ['ruibarbo', 'Rhubarb'],
  ['salvia (mudas)', 'Sage (seedlings)'],
  ['salsa (perene)', 'Parsley (perennial)'],
  ['salsifi', 'Salsify'],
  ['scotch bonnet', 'Scotch Bonnet'],
  ['serrano', 'Serrano'],
  ['shishito', 'Shishito'],
  ['soja (edamame)', 'Soybean (edamame)'],
  ['sorgo doce (caseiro)', 'Sweet sorghum (homegrown)'],
  ['tomate cereja', 'Cherry tomato'],
  ['tomate chucha', 'Plum tomato'],
  ['tomate coracao-de-boi', 'Oxheart tomato'],
  ['tomate italiano (roma)', 'Roma tomato'],
  ['tomatillo', 'Tomatillo'],
  ['tomilho (mudas)', 'Thyme (seedlings)'],
  ['topinambo (jerusalem artichoke)', 'Jerusalem artichoke (sunchoke)'],
  ['trigo (horta)', 'Wheat (garden)'],
  ['trigo-sarraceno', 'Buckwheat'],
  ['trinidad moruga scorpion', 'Trinidad Moruga Scorpion'],
  ['videira (uva de mesa)', 'Grapevine (table grape)'],
]);

function translateCropName(ptName) {
  const k = normKey(ptName)
    .replace(/ç/g, 'c')
    .replace(/ã/g, 'a')
    .replace(/õ/g, 'o')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ú/g, 'u')
    .replace(/â/g, 'a')
    .replace(/ê/g, 'e')
    .replace(/ô/g, 'o')
    .replace(/ó/g, 'o')
    .replace(/à/g, 'a')
    .replace(/ü/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/’/g, "'")
    .replace(/–/g, '-')
    .replace(/ +/g, ' ');
  // fix some known corrupted sequences to expected normalized keys
  const fixes = [['alh0', 'alho']];
  let kk = k;
  for (const [from, to] of fixes) kk = kk.replace(from, to);
  const m = cropMap.get(kk);
  if (m) return m;
  // fallback: capitalize first letter of each word without weird chars
  return ptName;
}

function translateZones(zonas) {
  const out = {};
  for (const [zoneName, zoneObj] of Object.entries(zonas)) {
    const num = (zoneName.match(/(\d+)/) || [null, null])[1];
    const enName = zoneName.replace(/ZONA/i, 'ZONE');
    const districts = (zoneObj.distritos || []).map(translateDistrict);
    let notes = String(zoneObj.notas || '');
    switch (num) {
      case '1':
        notes =
          'High productivity; watch for fungi on the northern coast and water scarcity in the south.';
        break;
      case '2':
        notes =
          'Use greenhouses/tunnels to start early; efficient irrigation in summer; good for olive, almond and grapevine.';
        break;
      case '3':
        notes =
          'Good for leafy and irrigated crops; monitor humidity-related pests; crop rotation recommended.';
        break;
      case '4':
        notes =
          'Delay cold-sensitive transplants until May; use companion planting (corn+bean+pumpkin).';
        break;
      case '5':
        notes =
          'Favors tropical/subtropical crops; manage drainage due to high rainfall in rainy periods.';
        break;
      default:
        notes = String(zoneObj.notas || '');
    }
    out[enName] = { districts, notes };
  }
  return out;
}

function translateCalendar(cal) {
  const out = {};
  for (const [zoneName, zoneObj] of Object.entries(cal)) {
    const enZoneName = zoneName.replace(/ZONA/i, 'ZONE');
    const translatedZone = {};
    for (const [cropName, stagesObj] of Object.entries(zoneObj)) {
      const enCrop = translateCropName(cropName);
      const enStages = {};
      for (const [stageKey, months] of Object.entries(stagesObj)) {
        const enKey = translateStageKey(stageKey);
        enStages[enKey] = Array.isArray(months) ? months.map(translateMonth) : [];
      }
      translatedZone[enCrop] = enStages;
    }
    out[enZoneName] = translatedZone;
  }
  return out;
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const inPath = path.join(__dirname, '..', 'public', 'calendario.json');
  const outPath = path.join(__dirname, '..', 'public', 'calendario.en-us.json');
  const data = readJson(inPath);
  const translated = {
    zones: translateZones(data.zonas || {}),
    calendar: translateCalendar(data.calendario || {}),
  };
  writeJson(outPath, translated);
  console.log(`Wrote: ${path.relative(process.cwd(), outPath)}`);
}
main();
