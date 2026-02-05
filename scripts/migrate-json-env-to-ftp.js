import * as ftpStorage from "../ftpStorage.js";

const mappings = [
  {
    env: "PL_LIENS_GARANTIE_RETOUR_JSON",
    file: "pl_liens_garantie_retour.json",
  },
  {
    env: "VL_LIENS_FORMULAIRE_GARANTIE_JSON",
    file: "vl_liens_formulaire_garantie.json",
  },
];

function parseEnvJson(raw, envName) {
  const s = String(raw || "").trim();
  if (!s) throw new Error(`${envName} manquant`);
  const unquoted =
    (s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))
      ? s.slice(1, -1)
      : s;
  try {
    return JSON.parse(unquoted);
  } catch (e) {
    throw new Error(`${envName} invalide: ${e?.message || e}`);
  }
}

async function main() {
  const force = process.argv.includes("--force");
  let hadError = false;

  for (const m of mappings) {
    try {
      const data = parseEnvJson(process.env[m.env], m.env);
      const already = await ftpStorage.exists(m.file);
      if (already && !force) {
        console.log(`[SKIP] ${m.file} existe déjà. Utilisez --force pour écraser.`);
        continue;
      }
      await ftpStorage.writeJson(m.file, data, { backup: force });
      console.log(`[OK] ${m.file} écrit sur FTP`);
    } catch (e) {
      hadError = true;
      console.error(`[ERR] ${m.env}:`, e?.message || e);
    }
  }

  process.exit(hadError ? 1 : 0);
}

main().catch((e) => {
  console.error("[FATAL]", e?.message || e);
  process.exit(1);
});
