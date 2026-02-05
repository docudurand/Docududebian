Tu es un développeur senior Node.js/Express orienté sécurité. Contexte : site interne “Documents Durand” (Node/Express dans Docker, reverse proxy Nginx). Les données (JSON et pièces jointes) doivent être stockées sur mon serveur FTP Freebox. Sur le FTP, j’ai déjà un dossier /service/ qui contient des JSON (atelier_data.json, compteurs.json, contacts_fournisseurs.json, demandes.json, fournisseur.json, pret_vehicules.json, vl_retour_garantie.json). 

OBJECTIF GLOBAL
Créer une page admin “éditeur JSON” totalement isolée du reste du site (aucun lien visible depuis le portail), accessible via une URL non évidente (suite aléatoire lettres+chiffres), et protégée par double authentification TOTP compatible Google Authenticator.

PAGES CONCERNEES (leurs données proviennent de JSON)
Je veux pouvoir éditer les JSON importés par ces pages :
- fournisseur-pl.html
- liens-garantie-retour-pl.html
- fournisseur-vl.html
- liens-formulaire-garantie.html
- retour-fournisseur-garantie-vl.html
- contact-fournisseur.html
- demande-ramasse.html
- site-identification-oe.html
- documents-atelier.html

L’éditeur doit proposer un menu déroulant “Choisir la page à modifier”.
Quand je sélectionne une page, il charge le JSON correspondant depuis le FTP, l’affiche, permet modification puis “Enregistrer”.
À l’enregistrement : validation JSON + sauvegarde backup (.bak timestamp) + écriture sur le FTP.

EMPLACEMENT FTP
Tous les JSON éditables doivent être stockés dans le même dossier FTP : /service/
Le backend Node doit donc lire/écrire en FTP dans ce répertoire.
Créer un module utilitaire ftpStorage.js :
- readJson(filename) -> objet
- writeJson(filename, obj, {backup:true}) -> écrit JSON (pretty, UTF-8), backup auto en filename.YYYYMMDD-HHMMSS.bak.json
- exists(filename)
- listJsonFiles()

Utiliser la lib "basic-ftp" et gérer :
- timeouts
- reconnexion simple (retry 2-3 fois)
- messages d’erreurs propres

MIGRATION OBLIGATOIRE (ENV -> FTP)
Actuellement, 2 jeux de données sont dans des variables d’environnement :
1) PL_LIENS_GARANTIE_RETOUR_JSON
2) VL_LIENS_FORMULAIRE_GARANTIE_JSON

Je veux les convertir en fichiers JSON sur le FTP (dans /service/) :
- /service/pl_liens_garantie_retour.json
- /service/vl_liens_formulaire_garantie.json

CONTENU EXACT DE CES ENV (à utiliser pour tests et migration)
PL_LIENS_GARANTIE_RETOUR_JSON =
[{"label":"APPREVIA DEMANDE DE GARANTIE + FICHE RENSEIGNEMENT","url":"https://drive.google.com/file/d/1X_ecVeKXzmdT96h6-sQGwjOP4RTFO7NP/view?usp=sharing"},{"label":"APPREVIA DEMANDE DE RETOUR CLIENTS","url":"https://drive.google.com/file/d/10RD6xIu8g8MqFO96NjspEDJLCgN4fUlZ/view?usp=sharing"},{"label":"DEMANDE DE RETOUR PF LE RHEU","url":"https://drive.google.com/file/d/1bNLVIjoc_-1Bg-QI9afuwEH10jbHKV5d/view?usp=sharing"},{"label":"FORMULAIRE RETOUR CONSIGNE GIBERVILLE","url":"https://drive.google.com/file/d/1gbB9JWQRz1Zzz5MC6oWvc76qsPsOOJO3/view?usp=sharing"},{"label":"GAMOTECH","url":"https://drive.google.com/file/d/1EiWalbApRciNXby2DGTyzqWSvP-0u17h/view?usp=sharing"},{"label":"GARANTIE VALEO","url":"https://drive.google.com/file/d/1remVQHY128vbWNKK6kBu60RmxFSYKAcG/view?usp=sharing"},{"label":"NAPA","url":"https://drive.google.com/file/d/12-mkFevRLU81Be4hcP8d536if36bBVMP/view?usp=sharing"},{"label":"PROCEDURE DE GARANTIE PF LE RHEU","url":"https://drive.google.com/file/d/1hjKKQly2qzAzcUjrS_v1cmxWjfNHAkbT/view?usp=sharing"},{"label":"RETOUR GARANTIE ORIGINE PF BLOIS","url":"https://docs.google.com/document/d/1QIaQ9nRbkmNVEBjiF_kXznouwlNx0k6-/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"RETOUR VIEILLES MATIERES DINEX","url":"https://drive.google.com/file/d/15_FSxWW2bAPjIe1pepnCJvBYvoALWVrQ/view?usp=sharing"},{"label":"RETOUR VIEILLES MATIERES REMA","url":"https://drive.google.com/file/d/1wew_6L4pwKJjte3QEmIMHG3pJIrUSe9B/view?usp=sharing"}]

VL_LIENS_FORMULAIRE_GARANTIE_JSON =
[{"label":"AUTOGAMMA VERTAT","url":"https://docs.google.com/spreadsheets/d/1hoMgJYdjPM2DBF85hT5AylhT9qrbLx8Voc-tlEeQT-Q/edit?usp=sharing"},{"label":"ETIQUETTE FACOM EXPERT","url":"https://drive.google.com/file/d/1XfHFCHjht0WgO7T7wPA4ggaX7lmSI7tO/view"},{"label":"BOSCH MACHINE TOURNANTE INFO VEHICULE","url":"https://drive.google.com/file/d/1NauKnEm5CJkS9mcubnfLt7njPx9X5627/view?usp=sharing"},{"label":"BOSCH MACHINE TOURNANT DEMANDE TRANSPORT","url":"https://docs.google.com/spreadsheets/d/122Xgk9VobWISxXzXkpJI4LMCQKoK0qE8/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"DELPHI PROCEDURE GARANTIE INJECTEURS / POMPES HP","url":"https://docs.google.com/document/d/16Ih5yFUpiNpsS6G8Xs4tUe_9WdJoFJiK/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"DELPHI","url":"https://docs.google.com/spreadsheets/d/1im-mz1pRXNxXG6Ay_XIEgbhiOwJ9warr/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"EFI AUTOMOTIVE","url":"https://drive.google.com/file/d/1C8o_Zdk1kjz_omiLG_1Eu9QzxHpHIn8Z/view?usp=sharing"},{"label":"FEBI","url":"https://docs.google.com/spreadsheets/d/1kbc2iQwxY00NnkFw1Dv8FIfZ1UH9xwKhcXYvrFuk0k8/edit?usp=sharing"},{"label":"GATES","url":"https://docs.google.com/spreadsheets/d/1Dl0PdaXfN5W1Z6fatLDs4mtTRyWqnq0j/edit?gid=582185838#gid=582185838"},{"label":"HELLA","url":"https://docs.google.com/spreadsheets/d/1paZygbt8E8NfUwq_6wJLOE03kl3BmgPn/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"INTRADIS","url":"https://drive.google.com/file/d/1f_bzvpKN3xUCpslm_G_--n0aQvqW5LUR/view?usp=sharing"},{"label":"LUK","url":"https://docs.google.com/spreadsheets/d/15mXFV5Xz-lo0Yg7ba4pAZdfPTGJxbZzY/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"MAGNETI MARELLI","url":"https://drive.google.com/file/d/1TmL_AvO135ou5GDIkr8F1A3ofETKZmET/view?usp=sharing"},{"label":"NAPA","url":"https://drive.google.com/file/d/12-mkFevRLU81Be4hcP8d536if36bBVMP/view?usp=drive_link"},{"label":"NRF","url":"https://docs.google.com/spreadsheets/d/1qvGC7ttzOYS3HBijCiRbpotceGks5sPQ/edit?usp=sharing&ouid=113127601077999246400&rtpof=true&sd=true"},{"label":"SPILU","url":"https://docs.google.com/spreadsheets/d/1K1L5DKRcjEQETfD3IOZNLShmMTnoCCyU/edit?gid=1151402303#gid=1151402303"},{"label":"TUTO PRE-ACCORD VALEO EMBRAYAGE","url":"https://drive.google.com/file/d/127CSefCP8Fed-qquru84lfCwLPXphkRF/view"},{"label":"TUTO VALEO TOUTE PIECE","url":"https://drive.google.com/file/d/1sJnnM7F2oHxagLGxm08x5pe84zb_GA4d/view?usp=sharing"}]

MIGRATION - LIVRABLE
Créer un script one-shot : scripts/migrate-json-env-to-ftp.js
- lit les 2 env ci-dessus
- parse le JSON
- écrit sur FTP : /service/pl_liens_garantie_retour.json et /service/vl_liens_formulaire_garantie.json
- si le fichier existe déjà : ne pas écraser sans option --force
- log clair + exit code correct

MODIF DU CODE EXISTANT (IMPORTANT)
Repérer dans le backend où ces env sont utilisées pour alimenter les pages :
- liens-garantie-retour-pl.html doit lire /service/pl_liens_garantie_retour.json
- liens-formulaire-garantie.html doit lire /service/vl_liens_formulaire_garantie.json
Ajouter un fallback bootstrap :
- si fichier FTP absent -> lire env -> écrire fichier FTP -> utiliser fichier

AUTH 2FA (Google Authenticator)
Implémenter TOTP (otplib) + QR code (qrcode).
Stockage auth dans un fichier sur FTP : /service/admin_auth.json
Ce fichier doit être chiffré AES-256-GCM avec une clé en env ADMIN_SECRET_KEY.
Ne jamais stocker le secret TOTP en clair.
Prévoir backup codes (10) hashés (bcrypt ou scrypt) affichés une seule fois lors de l’enrôlement.

ROUTES EXPRESS
- GET  /<ADMIN_EDITOR_PATH>                -> page (si pas logué -> login)
- GET  /<ADMIN_EDITOR_PATH>/setup          -> enrôlement si pas initialisé
- POST /<ADMIN_EDITOR_PATH>/setup/verify   -> vérifie TOTP, active, génère backup codes
- GET  /<ADMIN_EDITOR_PATH>/login          -> saisie code TOTP ou backup code
- POST /<ADMIN_EDITOR_PATH>/login          -> vérif + session
- POST /<ADMIN_EDITOR_PATH>/logout         -> logout
- GET  /<ADMIN_EDITOR_PATH>/api/load?key=...  -> retourne JSON (auth obligatoire)
- POST /<ADMIN_EDITOR_PATH>/api/save          -> sauvegarde JSON (auth obligatoire)

SECURITE MINIMALE
- helmet
- rate-limit sur setup/login (5 tentatives / 5 min)
- session cookie httpOnly, secure si HTTPS, SameSite=Lax
- CSRF token simple en session

INTERFACE UI
Pas de framework. Une seule page HTML simple :
- Select “Page à modifier” (les 9 pages listées)
- Bouton Charger
- Textarea JSON + bouton “Beautify” + validation (message)
- Bouton Enregistrer
- Afficher “Dernière modification” (via un fichier meta ou en lisant mtime FTP si faisable)

REGISTRY / MAPPING
Créer un fichier jsonRegistry.js qui mappe :
- fournisseur-pl.html -> fournisseur_pl.json (ou réutiliser fournisseur.json si c’est celui-là)
- liens-garantie-retour-pl.html -> pl_liens_garantie_retour.json
- fournisseur-vl.html -> fournisseur.json (si c’est la source)
- liens-formulaire-garantie.html -> vl_liens_formulaire_garantie.json
- retour-fournisseur-garantie-vl.html -> vl_retour_garantie.json
- contact-fournisseur.html -> contacts_fournisseurs.json
- demande-ramasse.html -> demandes.json (ou un fichier dédié si besoin)
- site-identification-oe.html -> compteur/identification json (à définir dans registry)
- documents-atelier.html -> atelier_data.json
Le but est que ce mapping soit centralisé et que l’éditeur utilise uniquement ces “keys”.

VARIABLES ENV À AJOUTER
- FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT
- FTP_BASE_DIR=/service
- ADMIN_EDITOR_PATH (ex: "a9F3kQ2pX7Z1")
- ADMIN_SECRET_KEY (32 bytes min, base64 ok)
- ADMIN_ISSUER="DocumentsDurand"

LIVRABLES ATTENDUS
1) Modules : ftpStorage.js, jsonRegistry.js, admin2fa.js (chiffrement+TOTP), routes admin editor
2) UI HTML
3) Script migration scripts/migrate-json-env-to-ftp.js + commande npm "migrate:json-env-to-ftp"
4) Modifs du backend existant pour consommer les fichiers FTP au lieu des env
5) README admin-json-editor.md (setup, enrollement, migration, rollback .bak)

CONTRAINTES
- Code robuste et lisible
- Validation JSON stricte
- Ne rien casser sur le reste du site
- L’URL “non trouvable” n’est pas la sécurité principale : 2FA obligatoire
