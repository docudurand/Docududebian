import ftp from "basic-ftp";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const DEFAULT_TIMEOUT_MS = 45_000;
const RETRYABLE = /ECONNRESET|Client is closed|ETIMEDOUT|ENOTCONN|EPIPE|426|425/i;

function nowStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function tmpFile(prefix) {
  const rnd = crypto.randomBytes(6).toString("hex");
  return path.join(os.tmpdir(), `${prefix}_${Date.now()}_${rnd}`);
}

function envBaseDir() {
  const raw =
    String(process.env.FTP_BASE_DIR || "").trim() ||
    String(process.env.FTP_BACKUP_FOLDER || "").trim() ||
    "/service";
  return raw.replace(/\/+$/, "");
}

function envFtpConfig() {
  const host = String(process.env.FTP_HOST || "").trim();
  const user = String(process.env.FTP_USER || "").trim();
  const password = String(process.env.FTP_PASS || process.env.FTP_PASSWORD || "").trim();
  const port = process.env.FTP_PORT ? Number(process.env.FTP_PORT) : 21;
  const secure = String(process.env.FTP_SECURE || "false") === "true";
  const rejectUnauthorized = String(process.env.FTP_TLS_REJECT_UNAUTH || "1") !== "0";
  return { host, user, password, port, secure, rejectUnauthorized };
}

function assertFileName(filename) {
  const name = String(filename || "").trim();
  if (!name) throw new Error("filename requis");
  if (name.includes("..")) throw new Error("filename invalide");
  return name.replace(/\\/g, "/");
}

function buildRemotePath(filename) {
  const base = envBaseDir();
  const name = assertFileName(filename);
  return path.posix.join(base, name);
}

async function connectClient() {
  const cfg = envFtpConfig();
  if (!cfg.host || !cfg.user || !cfg.password) {
    throw new Error("FTP_HOST/FTP_USER/FTP_PASS manquants");
  }
  const client = new ftp.Client(DEFAULT_TIMEOUT_MS);
  client.prepareTransfer = ftp.enterPassiveModeIPv4;
  await client.access({
    host: cfg.host,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    secure: cfg.secure,
    secureOptions: {
      rejectUnauthorized: cfg.rejectUnauthorized,
      servername: cfg.host || undefined,
    },
  });
  try {
    client.ftp.socket?.setKeepAlive?.(true, 10_000);
    client.ftp.timeout = DEFAULT_TIMEOUT_MS;
  } catch {}
  return client;
}

async function withClient(fn, retries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    let client;
    try {
      client = await connectClient();
      return await fn(client);
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message || "") + " " + String(e?.code || "");
      if (attempt >= retries || !RETRYABLE.test(msg)) break;
      try { client?.close(); } catch {}
      await new Promise(r => setTimeout(r, 250 * attempt));
    } finally {
      try { client?.close(); } catch {}
    }
  }
  throw lastErr;
}

export async function exists(filename) {
  const remote = buildRemotePath(filename);
  return withClient(async (client) => {
    try {
      await client.size(remote);
      return true;
    } catch (e) {
      if (String(e?.code) === "550") return false;
      const msg = String(e?.message || "");
      if (msg.includes("550")) return false;
      throw e;
    }
  });
}

export async function readText(filename) {
  const remote = buildRemotePath(filename);
  return withClient(async (client) => {
    const out = tmpFile("ftp_read");
    try {
      await client.downloadTo(out, remote);
      const txt = fs.readFileSync(out, "utf8");
      return txt;
    } catch (e) {
      if (String(e?.code) === "550" || String(e?.message || "").includes("550")) return null;
      throw e;
    } finally {
      try { fs.unlinkSync(out); } catch {}
    }
  });
}

export async function writeText(filename, text) {
  const remote = buildRemotePath(filename);
  return withClient(async (client) => {
    const out = tmpFile("ftp_write");
    try {
      fs.writeFileSync(out, text, "utf8");
      const dir = path.posix.dirname(remote);
      await client.ensureDir(dir);
      await client.uploadFrom(out, remote);
    } finally {
      try { fs.unlinkSync(out); } catch {}
    }
  });
}

export async function readJson(filename) {
  const txt = await readText(filename);
  if (txt == null) return null;
  try {
    return JSON.parse(txt);
  } catch (e) {
    const msg = e?.message || "JSON invalide";
    throw new Error(`JSON invalide dans ${filename}: ${msg}`);
  }
}

export async function writeJson(filename, obj, options = {}) {
  const pretty = JSON.stringify(obj, null, 2) + "\n";
  const remote = buildRemotePath(filename);
  const doBackup = options?.backup !== false;

  return withClient(async (client) => {
    const out = tmpFile("ftp_json");
    const dir = path.posix.dirname(remote);
    try {
      if (doBackup) {
        try {
          const tmpOld = tmpFile("ftp_old");
          await client.downloadTo(tmpOld, remote);
          const bakName = `${filename}.${nowStamp()}.bak.json`;
          const bakRemote = buildRemotePath(bakName);
          await client.ensureDir(path.posix.dirname(bakRemote));
          await client.uploadFrom(tmpOld, bakRemote);
          try { fs.unlinkSync(tmpOld); } catch {}
        } catch (e) {
          const msg = String(e?.message || "");
          if (!msg.includes("550")) {
            throw e;
          }
        }
      }

      fs.writeFileSync(out, pretty, "utf8");
      await client.ensureDir(dir);
      await client.uploadFrom(out, remote);
    } finally {
      try { fs.unlinkSync(out); } catch {}
    }
  });
}

export async function listJsonFiles() {
  const dir = envBaseDir();
  return withClient(async (client) => {
    try {
      const list = await client.list(dir);
      return list
        .filter(it => it.isFile && String(it.name || "").toLowerCase().endsWith(".json"))
        .map(it => it.name);
    } catch (e) {
      const msg = String(e?.message || "");
      if (msg.includes("550")) return [];
      throw e;
    }
  });
}

export async function getModifiedAt(filename) {
  const remote = buildRemotePath(filename);
  return withClient(async (client) => {
    try {
      const dt = await client.lastMod(remote);
      return dt ? dt.toISOString() : null;
    } catch (e) {
      const msg = String(e?.message || "");
      if (msg.includes("550")) return null;
      return null;
    }
  });
}

export function getBaseDir() {
  return envBaseDir();
}
