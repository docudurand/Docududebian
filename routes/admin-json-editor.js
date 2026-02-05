import express from "express";
import rateLimit from "express-rate-limit";
import qrcode from "qrcode";
import crypto from "crypto";

import * as ftpStorage from "../ftpStorage.js";
import { registry, getByKey } from "../jsonRegistry.js";
import {
  loadAuth,
  saveAuth,
  generateTotpSecret,
  buildOtpAuthUrl,
  verifyTotp,
  makeBackupCodes,
  consumeBackupCode,
} from "../admin2fa.js";

function ensureCsrf(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = cryptoRandom();
  }
  return req.session.csrfToken;
}

function cryptoRandom() {
  return crypto.randomBytes(16).toString("hex");
}

function requireAuth(req, res, next) {
  if (req.session?.adminAuthed) return next();
  return res.status(401).json({ ok: false, error: "not_authenticated" });
}

function requireCsrf(req, res, next) {
  const token = req.session?.csrfToken || "";
  const provided =
    String(req.get("x-csrf-token") || "") ||
    String(req.body?.csrfToken || "");
  if (!token || !provided || token !== provided) {
    return res.status(403).json({ ok: false, error: "csrf_invalid" });
  }
  return next();
}

function htmlPage(title, body) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    :root{color-scheme:light}
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;padding:24px;background:#f6f7fb;color:#0f172a}
    .wrap{max-width:980px;margin:0 auto}
    .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
    h1{font-size:22px;margin:0 0 12px}
    label{display:block;font-weight:700;margin:14px 0 6px}
    input,select,textarea,button{font:inherit}
    input,select,textarea{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px}
    textarea{min-height:360px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    .row{display:flex;gap:10px;flex-wrap:wrap}
    .btn{background:#2563eb;color:#fff;border:0;padding:10px 16px;border-radius:10px;cursor:pointer;font-weight:700}
    .btn.secondary{background:#e5e7eb;color:#111}
    .btn.danger{background:#b91c1c}
    .msg{margin-top:10px;font-weight:700}
    .muted{color:#6b7280;font-size:13px}
    code{background:#eef2ff;padding:2px 6px;border-radius:6px}
  </style>
</head>
<body>
  <div class="wrap">
    ${body}
  </div>
</body>
</html>`;
}

function editorPage(baseUrl, csrfToken) {
  const registryJson = JSON.stringify(registry);
  return htmlPage("Editeur JSON", `
  <div class="card">
    <h1>Editeur JSON</h1>
    <div class="muted">Accès protégé 2FA. Dernière modification affichée après chargement.</div>
    <label for="pageKey">Choisir la page à modifier</label>
    <select id="pageKey"></select>
    <div class="row" style="margin-top:12px">
      <button class="btn" id="btnLoad" type="button">Charger</button>
      <button class="btn secondary" id="btnBeautify" type="button">Beautify</button>
      <button class="btn" id="btnSave" type="button">Enregistrer</button>
    </div>
    <label for="jsonArea">JSON</label>
    <textarea id="jsonArea" spellcheck="false"></textarea>
    <div class="row" style="margin-top:10px">
      <div class="muted">Dernière modification: <span id="lastMod">—</span></div>
    </div>
    <form method="POST" action="${baseUrl}/logout" style="margin-top:12px">
      <input type="hidden" name="csrfToken" value="${csrfToken}"/>
      <button class="btn danger" type="submit">Logout</button>
    </form>
    <div class="msg" id="msg"></div>
  </div>
  <script>
    const BASE = ${JSON.stringify(baseUrl)};
    const CSRF = ${JSON.stringify(csrfToken)};
    const registry = ${registryJson};
    const sel = document.getElementById("pageKey");
    const area = document.getElementById("jsonArea");
    const msg = document.getElementById("msg");
    const lastMod = document.getElementById("lastMod");

    registry.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.key;
      opt.textContent = r.label + " (" + r.page + ")";
      sel.appendChild(opt);
    });

    function setMsg(text, ok) {
      msg.textContent = text || "";
      msg.style.color = ok ? "green" : "crimson";
    }

    document.getElementById("btnLoad").addEventListener("click", async () => {
      setMsg("Chargement...", true);
      const key = sel.value;
      try {
        const r = await fetch(\`\${BASE}/api/load?key=\${encodeURIComponent(key)}\`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur chargement");
        area.value = JSON.stringify(j.data, null, 2);
        lastMod.textContent = j.lastModified || "—";
        setMsg("Chargé.", true);
      } catch (e) {
        setMsg(String(e.message || e), false);
      }
    });

    document.getElementById("btnBeautify").addEventListener("click", () => {
      try {
        const parsed = JSON.parse(area.value);
        area.value = JSON.stringify(parsed, null, 2);
        setMsg("JSON valide.", true);
      } catch (e) {
        setMsg("JSON invalide: " + e.message, false);
      }
    });

    document.getElementById("btnSave").addEventListener("click", async () => {
      const key = sel.value;
      let parsed;
      try {
        parsed = JSON.parse(area.value);
      } catch (e) {
        setMsg("JSON invalide: " + e.message, false);
        return;
      }
      setMsg("Enregistrement...", true);
      try {
        const r = await fetch(\`\${BASE}/api/save\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": CSRF
          },
          body: JSON.stringify({ key, data: parsed })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Erreur sauvegarde");
        lastMod.textContent = j.lastModified || "—";
        setMsg("Enregistré.", true);
      } catch (e) {
        setMsg(String(e.message || e), false);
      }
    });
  </script>
  `);
}

function setupPage(qrDataUrl, secret, csrfToken) {
  return htmlPage("Setup 2FA", `
  <div class="card">
    <h1>Configuration 2FA</h1>
    <p>Scannez le QR code dans Google Authenticator, puis saisissez le code.</p>
    <div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
      <img src="${qrDataUrl}" alt="QR Code" width="220" height="220"/>
      <div>
        <div class="muted">Secret (si besoin): <code>${secret}</code></div>
      </div>
    </div>
    <form method="POST" action="./setup/verify" style="margin-top:16px">
      <input type="hidden" name="csrfToken" value="${csrfToken}"/>
      <label>Code TOTP</label>
      <input name="code" inputmode="numeric" autocomplete="one-time-code" required />
      <button class="btn" style="margin-top:12px" type="submit">Vérifier</button>
    </form>
  </div>`);
}

function loginPage(csrfToken) {
  return htmlPage("Login 2FA", `
  <div class="card">
    <h1>Connexion</h1>
    <p>Saisissez un code TOTP ou un backup code.</p>
    <form method="POST" action="./login">
      <input type="hidden" name="csrfToken" value="${csrfToken}"/>
      <label>Code</label>
      <input name="code" autocomplete="one-time-code" required />
      <button class="btn" style="margin-top:12px" type="submit">Se connecter</button>
    </form>
  </div>`);
}

function backupCodesPage(codes) {
  const list = codes.map(c => `<li><code>${c}</code></li>`).join("");
  return htmlPage("Backup Codes", `
  <div class="card">
    <h1>Backup codes</h1>
    <p>Conservez ces codes en lieu sûr. Ils ne seront affichés qu'une seule fois.</p>
    <ul>${list}</ul>
    <form method="POST" action="./logout">
      <button class="btn danger" type="submit">Fermer</button>
    </form>
  </div>`);
}

export default function createAdminEditorRouter() {
  const router = express.Router();
  const basePath = String(process.env.ADMIN_EDITOR_PATH || "").trim();
  if (!basePath) {
    console.warn("[ADMIN] ADMIN_EDITOR_PATH manquant, routes admin non activées.");
    return router;
  }

  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.use(express.urlencoded({ extended: true }));

  router.get(`/${basePath}`, async (req, res) => {
    if (!req.session?.adminAuthed) return res.redirect(`/${basePath}/login`);
    const token = ensureCsrf(req);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(editorPage(`/${basePath}`, token));
  });

  router.get(`/${basePath}/setup`, limiter, async (req, res) => {
    const existing = await loadAuth().catch(() => null);
    if (existing?.enabled) return res.redirect(`/${basePath}/login`);
    if (!req.session.setupSecret) {
      req.session.setupSecret = generateTotpSecret();
    }
    const secret = req.session.setupSecret;
    const otpauth = buildOtpAuthUrl(secret);
    const qrDataUrl = await qrcode.toDataURL(otpauth);
    const token = ensureCsrf(req);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(setupPage(qrDataUrl, secret, token));
  });

  router.post(`/${basePath}/setup/verify`, limiter, async (req, res) => {
    const token = ensureCsrf(req);
    if (req.body?.csrfToken !== token) {
      return res.status(403).send("CSRF invalide");
    }
    const existing = await loadAuth().catch(() => null);
    if (existing?.enabled) return res.redirect(`/${basePath}/login`);
    const secret = req.session.setupSecret;
    const code = String(req.body?.code || "").trim();
    if (!secret || !verifyTotp(secret, code)) {
      return res.status(400).send("Code invalide");
    }
    const { codes, hashed } = makeBackupCodes(10);
    await saveAuth({
      enabled: true,
      createdAt: new Date().toISOString(),
      totpSecret: secret,
      backupCodes: hashed,
    });
    req.session.adminAuthed = true;
    req.session.setupSecret = null;
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(backupCodesPage(codes));
  });

  router.get(`/${basePath}/login`, limiter, async (req, res) => {
    const auth = await loadAuth().catch(() => null);
    if (!auth?.enabled) return res.redirect(`/${basePath}/setup`);
    if (req.session?.adminAuthed) return res.redirect(`/${basePath}`);
    const token = ensureCsrf(req);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(loginPage(token));
  });

  router.post(`/${basePath}/login`, limiter, async (req, res) => {
    const token = ensureCsrf(req);
    if (req.body?.csrfToken !== token) {
      return res.status(403).send("CSRF invalide");
    }
    const auth = await loadAuth().catch(() => null);
    if (!auth?.enabled) return res.redirect(`/${basePath}/setup`);

    const code = String(req.body?.code || "").trim();
    const okTotp = verifyTotp(auth.totpSecret, code);
    let okBackup = false;
    if (!okTotp && Array.isArray(auth.backupCodes)) {
      okBackup = consumeBackupCode(auth.backupCodes, code);
      if (okBackup) await saveAuth(auth);
    }

    if (!okTotp && !okBackup) {
      return res.status(401).send("Code invalide");
    }

    req.session.adminAuthed = true;
    return res.redirect(`/${basePath}`);
  });

  router.post(`/${basePath}/logout`, requireCsrf, (req, res) => {
    req.session.adminAuthed = false;
    return res.redirect(`/${basePath}/login`);
  });

  router.get(`/${basePath}/api/load`, requireAuth, async (req, res) => {
    const key = String(req.query?.key || "").trim();
    const entry = getByKey(key);
    if (!entry) return res.status(404).json({ ok: false, error: "unknown_key" });
    try {
      const data = await ftpStorage.readJson(entry.filename);
      if (data == null) {
        return res.status(404).json({ ok: false, error: "file_not_found" });
      }
      const lastModified = await ftpStorage.getModifiedAt(entry.filename);
      res.setHeader("Cache-Control", "no-store");
      return res.json({ ok: true, data, lastModified, filename: entry.filename });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  router.post(`/${basePath}/api/save`, requireAuth, requireCsrf, express.json({ limit: "2mb" }), async (req, res) => {
    const key = String(req.body?.key || "").trim();
    const entry = getByKey(key);
    if (!entry) return res.status(404).json({ ok: false, error: "unknown_key" });
    const data = req.body?.data;
    if (data === undefined) {
      return res.status(400).json({ ok: false, error: "missing_data" });
    }
    try {
      await ftpStorage.writeJson(entry.filename, data, { backup: true });
      const lastModified = await ftpStorage.getModifiedAt(entry.filename);
      return res.json({ ok: true, lastModified });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });

  return router;
}
