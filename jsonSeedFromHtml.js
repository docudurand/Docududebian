import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readFile(relPath) {
  const p = path.join(__dirname, relPath);
  return fs.readFileSync(p, "utf8");
}

function decodeHtml(str) {
  return String(str || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, ""));
}

function parseTableRows(tableHtml) {
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(tableHtml))) {
    const tds = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let td;
    while ((td = tdRe.exec(tr[1]))) tds.push(td[1]);
    if (tds.length) rows.push(tds);
  }
  return rows;
}

function extractLinkAndText(cellHtml) {
  const linkRe = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
  const m = linkRe.exec(cellHtml || "");
  if (m) {
    return { url: decodeHtml(m[1]), text: stripTags(m[2]) };
  }
  return { url: "", text: stripTags(cellHtml) };
}

function seedFournisseurPl() {
  return [
    { fournisseur: "ALDER", code: "331", pieces: "BOUTEILLES  AIR\nPIECES CARROSSERIE" },
    { fournisseur: "APREVIA", code: "1220", pieces: "PIECES ORIGINE RVI / IVECO (SITE GROUPEMENT GTRUCK)" },
    { fournisseur: "ATS", code: "1343", pieces: "PIECES BUS" },
    { fournisseur: "APS REMATRUCK", code: "1561", pieces: "PIECES : BV / PONT / BOITIER DIRECTION" },
    { fournisseur: "ASSALI STEFEN", code: "A", pieces: "PIECES ASSALI + ROR" },
    { fournisseur: "ASPOCK", code: "1148", pieces: "FEUX ASPOCK / PROPLAST" },
    { fournisseur: "AFHYMAT", code: "1088", pieces: "RESERVOIRS HYDRAULIQUE" },
    { fournisseur: "ALS SERVICES", code: "1544", pieces: "PIECES KAISER / FREINAGE" },
    { fournisseur: "ATTELAGE MG", code: "1503", pieces: "CROCHETS MG" },
    { fournisseur: "AUTOVER DIMA", code: "80", pieces: "PARE BRISE  / JOINTS" },
    { fournisseur: "BOSCH", code: "004", pieces: "PIECES BOSCH ( SITE GROUPEMENT  GTRUCK - LE HELLO )" },
    { fournisseur: "BG DIFFUSION", code: "254", pieces: "PIECES MOTEUR  / FILETS RAPPORTÉS" },
    { fournisseur: "BPW SAIRO", code: "1143", pieces: "PIECES BPW (VOIR EGALEMENT GROUPEMENT)" },
    { fournisseur: "BREMSTAR", code: "1300", pieces: "PIECES FREINAGE" },
    { fournisseur: "BRIGADE ELECTRONIQUE", code: "1527", pieces: "FAISCEAUX ELECTRIQUES  / DEPANNAGE  / DIAG" },
    { fournisseur: "BRIDGEWAY", code: "1299", pieces: "ROULEMENTS / MOYEUX" },
    { fournisseur: "BSB", code: "1179", pieces: "AMORTISSEURS" },
    { fournisseur: "CARGO", code: "1099", pieces: "ALTERNATEUR / DEMARREUR / PIECES ELECTRIQUES" },
    { fournisseur: "CARRARO", code: "1303", pieces: "PONTS / TRANSMISSIONS" },
    { fournisseur: "CAUTEX", code: "1358", pieces: "PIECES CAOUTCHOUC" },
    { fournisseur: "CEVA / ZF", code: "1399", pieces: "PIECES ZF (BOITES DE VITESSES / PONTS)" },
    { fournisseur: "CHALLENGER", code: "1557", pieces: "PIECES REMORQUES" },
    { fournisseur: "CIM", code: "1467", pieces: "PIECES REMORQUES" },
    { fournisseur: "CLARKE", code: "1568", pieces: "PIECES CHASSIS  / BENNE" },
    { fournisseur: "COBO", code: "1188", pieces: "RETROS / OPTIQUES" },
    { fournisseur: "COLAR", code: "1396", pieces: "FILTRES / AIR / CABINE" },
    { fournisseur: "CONTITECH", code: "1245", pieces: "COURROIES / DURITES" },
    { fournisseur: "CORTECO", code: "649", pieces: "JOINTS / ETANCHEITE" },
    { fournisseur: "COJALI", code: "1325", pieces: "DIAGNOSTIC / ELECTRONIQUE" },
    { fournisseur: "DELFINGER", code: "1197", pieces: "OUTILLAGE / EQUIPEMENT" },
    { fournisseur: "DELPHI", code: "860", pieces: "INJECTION" },
    { fournisseur: "DINEX", code: "1382", pieces: "ECHAPPEMENT" },
    { fournisseur: "DT SPARE PARTS", code: "1125", pieces: "PIECES MULTIMARQUES" },
    { fournisseur: "EATON", code: "1431", pieces: "EMBRAYAGE / TRANSMISSION" },
    { fournisseur: "ELRING", code: "1105", pieces: "JOINTS MOTEUR" },
    { fournisseur: "EMMERRE", code: "1508", pieces: "PIECES REMORQUES" },
    { fournisseur: "EUROPLEX", code: "1312", pieces: "VITRAGE / OPTIQUES" },
    { fournisseur: "FAG", code: "1227", pieces: "ROULEMENTS" },
    { fournisseur: "FEBI", code: "1124", pieces: "PIECES MULTIMARQUES" },
    { fournisseur: "FERSA", code: "1470", pieces: "ROULEMENTS" },
    { fournisseur: "FTE", code: "1321", pieces: "EMETTEURS / RECEPTEURS EMBRAYAGE" },
    { fournisseur: "GATES", code: "1338", pieces: "COURROIES / DURITES" },
    { fournisseur: "GEORG FISCHER", code: "1554", pieces: "PIECES ECHAPPEMENT" },
    { fournisseur: "GIRLING", code: "1530", pieces: "FREINAGE" },
    { fournisseur: "HALDEX", code: "1129", pieces: "FREINAGE / SUSPENSION" },
    { fournisseur: "HENGST", code: "1398", pieces: "FILTRES" },
    { fournisseur: "HUTCHINSON", code: "1097", pieces: "PIECES CAOUTCHOUC" },
    { fournisseur: "IVECO", code: "1107", pieces: "ORIGINE IVECO" },
    { fournisseur: "JOST", code: "1079", pieces: "SELLES / PIECES ATTELAGE" },
    { fournisseur: "KNORR-BREMSE", code: "1109", pieces: "FREINAGE" },
    { fournisseur: "KONI", code: "1372", pieces: "AMORTISSEURS" },
    { fournisseur: "LECITRAILER", code: "1555", pieces: "PIECES REMORQUES" },
    { fournisseur: "LEMA", code: "1334", pieces: "DIRECTION / SUSPENSION" },
    { fournisseur: "LUCAS", code: "1531", pieces: "FREINAGE" },
    { fournisseur: "MAHLE", code: "1111", pieces: "FILTRES / THERMOSTATS" },
    { fournisseur: "MAN", code: "1112", pieces: "ORIGINE MAN" },
    { fournisseur: "MANN FILTER", code: "1201", pieces: "FILTRES" },
    { fournisseur: "MERITOR", code: "1114", pieces: "PONTS / FREINAGE" },
    { fournisseur: "MOTRIO", code: "1113", pieces: "PIECES RENAULT TRUCKS / MOTRIO" },
    { fournisseur: "NISSENS", code: "1524", pieces: "REFROIDISSEMENT" },
    { fournisseur: "NK", code: "1529", pieces: "FREINAGE" },
    { fournisseur: "OE", code: "OE", pieces: "ORIGINE CONSTRUCTEURS" },
    { fournisseur: "PAI", code: "1556", pieces: "PIECES MOTEUR" },
    { fournisseur: "PE AUTOMOTIVE", code: "1123", pieces: "PIECES MULTIMARQUES" },
    { fournisseur: "PNEUMACLIC", code: "PNEU", pieces: "PNEUMATIQUES" },
    { fournisseur: "RENAULT TRUCKS", code: "1115", pieces: "ORIGINE RENAULT TRUCKS" },
    { fournisseur: "ROBERT-LYE", code: "99", pieces: "PIECES CARROSSERIE" },
    { fournisseur: "SACHS", code: "1116", pieces: "EMBRAYAGE / AMORTISSEURS" },
    { fournisseur: "SAF HOLLAND", code: "1117", pieces: "PIECES REMORQUES" },
    { fournisseur: "SAS", code: "154", pieces: "PIECES (selon dépôt)" },
    { fournisseur: "SEIM", code: "214", pieces: "PIECES (selon dépôt)" },
    { fournisseur: "SESALY", code: "40", pieces: "PIECES (selon dépôt)" },
    { fournisseur: "TRW", code: "1119", pieces: "FREINAGE / DIRECTION" },
    { fournisseur: "VALEO", code: "1120", pieces: "EMBRAYAGE / REFROIDISSEMENT" },
    { fournisseur: "VOLVO", code: "1121", pieces: "ORIGINE VOLVO" },
    { fournisseur: "WABCO", code: "1122", pieces: "FREINAGE / ELECTRONIQUE" },
    { fournisseur: "WEBASTO", code: "1507", pieces: "CHAUFFAGE / CLIM" },
    { fournisseur: "WYNNS", code: "1528", pieces: "ADDITIFS" },
    { fournisseur: "ZF", code: "1118", pieces: "TRANSMISSION" }
  ];
}

function seedSiteIdentificationOe() {
  return [
    { marque: "RENAULT", url: "https://rpartstore.renault.com/", note: "IDENTIFIANT NECESSAIRE" },
    { marque: "PSA", url: "https://public.servicebox-parts.com/socle/?start=true", note: "IDENTIFIANT NECESSAIRE" },
    { marque: "TESLA", url: "https://epc.tesla.com/fr-FR/catalogs", note: "SANS IDENTIFIANT" },
    { marque: "ISUZU", url: "https://www.fitinpart.sg/", note: "SANS IDENTIFIANT" },
    { marque: "FIAT", url: "https://ajsparts.pl/pages/news.aspx", note: "IDENTIFIANT NECESSAIRE" },
    { marque: "MASERATI / FERRARI / LAMBORGHINI / ASTON MARTIN", url: "https://www.eurospares.fr/", note: "SANS IDENTIFIANT" },
    { marque: "JAGUAR", url: "https://www.sngbarratt.com/Francais/#/uk/home", note: "SANS IDENTIFIANT" },
    { marque: "ANCIENNE ANGLAISE (TRIUMPH / AUSTIN / MG / JAGUAR…)", url: "https://www.betaset.fr/fr/", note: "SANS IDENTIFIANT" },
    { marque: "SAAB / VOLVO", url: "https://www.skandix.de/en/", note: "SANS IDENTIFIANT" },
    { marque: "HONDA", url: "https://www.pieces-auto-honda.fr/", note: "SANS IDENTIFIANT" },
    { marque: "SSANG YONG", url: "https://www.catcar.info/en/", note: "SITE NON OFFICIEL MAIS RÉF OK" }
  ];
}

function seedFournisseurVl() {
  const html = readFile(path.join("vl", "fournisseur-vl.html"));
  const data = {
    categories: [],
    depots: [],
    back2car: [],
    hubCodes: [],
  };

  const catRe = /<section class="ds-section"[^>]*data-title="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let cm;
  while ((cm = catRe.exec(html))) {
    const title = decodeHtml(cm[1]);
    const sectionHtml = cm[2];
    const tableMatch = /<table[^>]*class="ds-table"[^>]*>([\s\S]*?)<\/table>/i.exec(sectionHtml);
    if (!tableMatch) continue;
    const rows = parseTableRows(tableMatch[1]);
    const items = [];
    for (const tds of rows) {
      if (tds.length < 4) continue;
      const link = extractLinkAndText(tds[0]);
      items.push({
        name: link.text,
        url: link.url,
        delais: stripTags(tds[1]),
        heureLimite: stripTags(tds[2]),
        infos: stripTags(tds[3]),
      });
    }
    if (items.length) data.categories.push({ title, items });
  }

  const depotGroupRe = /<div class="depot-group">([\s\S]*?)<\/div>/gi;
  let dg;
  while ((dg = depotGroupRe.exec(html))) {
    const groupHtml = dg[1];
    const labelMatch = /<div class="depot-label">([\s\S]*?)<\/div>/i.exec(groupHtml);
    const label = labelMatch ? stripTags(labelMatch[1]) : "";
    const tableMatch = /<table[^>]*class="depot-table"[^>]*>([\s\S]*?)<\/table>/i.exec(groupHtml);
    const items = [];
    if (tableMatch) {
      const rows = parseTableRows(tableMatch[1]);
      for (const tds of rows) {
        if (tds.length < 2) continue;
        items.push({ name: stripTags(tds[0]), code: stripTags(tds[1]) });
      }
    }
    if (label && items.length) data.depots.push({ name: label.replace(/:$/, ""), items });
  }

  const back2carMatch = /<section class="ds-anchor" id="code-back2car">([\s\S]*?)<\/section>/i.exec(html);
  if (back2carMatch) {
    const tableMatch = /<table[^>]*>([\s\S]*?)<\/table>/i.exec(back2carMatch[1]);
    if (tableMatch) {
      const rows = parseTableRows(tableMatch[1]);
      for (const tds of rows) {
        if (tds.length < 2) continue;
        data.back2car.push({ site: stripTags(tds[0]), code: stripTags(tds[1]) });
      }
    }
  }

  const hubMatch = /<section class="ds-anchor" id="code-hub">([\s\S]*?)<\/section>/i.exec(html);
  if (hubMatch) {
    const tableMatch = /<table[^>]*class="ds-table hub-table"[^>]*>([\s\S]*?)<\/table>/i.exec(hubMatch[1]);
    if (tableMatch) {
      const rows = parseTableRows(tableMatch[1]);
      for (const tds of rows) {
        if (tds.length < 1) continue;
        const label = stripTags(tds[0]);
        if (label) data.hubCodes.push({ label });
      }
    }
  }

  return data;
}

export { seedFournisseurPl, seedSiteIdentificationOe, seedFournisseurVl };
