# Admin JSON Editor

## Objectif
Editeur JSON isole, accessible via une URL non evidente, protégé par 2FA TOTP (Google Authenticator) + backup codes, et stockant les JSON sur FTP (`/Disque 1/service` via `FTP_BACKUP_FOLDER` ou `FTP_BASE_DIR`).

## Prérequis
- Node >= 20
- Variables d'environnement:
  - `FTP_HOST`, `FTP_USER`, `FTP_PASS` (ou `FTP_PASSWORD`), `FTP_PORT`
  - `FTP_BACKUP_FOLDER=/Disque 1/service` (ou `FTP_BASE_DIR`)
  - `ADMIN_EDITOR_PATH` (ex: `a9F3kQ2pX7Z1`)
  - `ADMIN_SECRET_KEY` (32 bytes min, base64 ok)
  - `ADMIN_ISSUER` (optionnel, défaut `DocumentsDurand`)
  - Optionnel: `SESSION_SECRET`

## Accès admin
URL: `/<ADMIN_EDITOR_PATH>`

## Enrôlement 2FA
1. Aller sur `/<ADMIN_EDITOR_PATH>/setup`
2. Scanner le QR code dans Google Authenticator
3. Saisir le code pour activer
4. Sauvegarder les 10 backup codes (affichés une seule fois)

Le fichier chiffré est stocké sur FTP: `/Disque 1/service/admin_auth.json`.

## Migration ENV -> FTP (one-shot)
Script:
```
node scripts/migrate-json-env-to-ftp.js
```
Option force:
```
node scripts/migrate-json-env-to-ftp.js --force
```
NPM:
```
npm run migrate:json-env-to-ftp
```

## Rollback / backups
Chaque sauvegarde via l'éditeur crée un backup:
```
<fichier>.YYYYMMDD-HHMMSS.bak.json
```
Les backups sont stockés dans le même répertoire FTP (`/Disque 1/service`).

## Pages mappées
Le mapping est centralisé dans `jsonRegistry.js`.

## Notes sécurité
- Session cookie `httpOnly`, `SameSite=Lax`, `secure` si HTTPS.
- Rate limit sur `/setup` et `/login` (5 essais / 5 min).
- CSRF token côté session.
