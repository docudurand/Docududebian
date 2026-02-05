import crypto from "crypto";
import { authenticator } from "otplib";
import * as ftpStorage from "./ftpStorage.js";

const AUTH_FILENAME = "admin_auth.json";

function parseSecretKey() {
  const raw = String(process.env.ADMIN_SECRET_KEY || "").trim();
  if (!raw) throw new Error("ADMIN_SECRET_KEY manquant");

  let buf;
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length % 4 === 0;
  if (isBase64) {
    try {
      buf = Buffer.from(raw, "base64");
    } catch {
      buf = Buffer.from(raw, "utf8");
    }
  } else {
    buf = Buffer.from(raw, "utf8");
  }
  if (buf.length < 32) {
    // derive 32 bytes
    buf = crypto.createHash("sha256").update(buf).digest();
  } else if (buf.length > 32) {
    buf = crypto.createHash("sha256").update(buf).digest();
  }
  return buf;
}

function encryptPayload(payload) {
  const key = parseSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: data.toString("base64"),
  };
}

function decryptPayload(wrapper) {
  const key = parseSecretKey();
  const iv = Buffer.from(wrapper.iv || "", "base64");
  const tag = Buffer.from(wrapper.tag || "", "base64");
  const data = Buffer.from(wrapper.data || "", "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(out.toString("utf8"));
}

function randomCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function hashBackupCode(code) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(code), salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyBackupCode(code, hashed) {
  const parts = String(hashed || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64");
  const expected = Buffer.from(parts[2], "base64");
  const actual = crypto.scryptSync(String(code), salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

async function loadAuth() {
  const txt = await ftpStorage.readText(AUTH_FILENAME);
  if (!txt) return null;
  let wrapper;
  try {
    wrapper = JSON.parse(txt);
  } catch {
    throw new Error("admin_auth.json invalide (JSON)");
  }
  return decryptPayload(wrapper);
}

async function saveAuth(payload) {
  const wrapper = encryptPayload(payload);
  await ftpStorage.writeText(AUTH_FILENAME, JSON.stringify(wrapper, null, 2));
}

function generateTotpSecret() {
  return authenticator.generateSecret();
}

function buildOtpAuthUrl(secret) {
  const issuer = String(process.env.ADMIN_ISSUER || "DocumentsDurand").trim();
  const label = String(process.env.ADMIN_ISSUER || "DocumentsDurand").trim();
  return authenticator.keyuri(label, issuer, secret);
}

function verifyTotp(secret, token) {
  return authenticator.check(String(token || "").trim(), secret);
}

function makeBackupCodes(count = 10) {
  const codes = [];
  const hashed = [];
  for (let i = 0; i < count; i++) {
    const code = randomCode() + "-" + randomCode();
    codes.push(code);
    hashed.push({ hash: hashBackupCode(code), used: false });
  }
  return { codes, hashed };
}

function consumeBackupCode(list, code) {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.used) continue;
    if (verifyBackupCode(code, item.hash)) {
      item.used = true;
      item.usedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}

export {
  loadAuth,
  saveAuth,
  generateTotpSecret,
  buildOtpAuthUrl,
  verifyTotp,
  makeBackupCodes,
  consumeBackupCode,
  AUTH_FILENAME,
};
