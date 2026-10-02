# Guide trésorier — Espace adhérent AKUU

> Compte Google : **akuu.asso@gmail.com**  
> Tableur : [2026 · Google Sheets](https://docs.google.com/spreadsheets/d/1VHVisgWvALpvj6xTc5xW7XQ3qihIui6YHYDW00fa-6o/edit)  
> Drive racine : [2026_NEW_Protocol](https://drive.google.com/drive/folders/1hAisydbVLOWUztBxi6XRCeGlrb8vBeSX)

---

## Déploiement (ordre strict)

### Étape A · Vous (Google)

1. Connectez-vous en **akuu.asso@gmail.com**
2. Ouvrez le [tableur 2026](https://docs.google.com/spreadsheets/d/1VHVisgWvALpvj6xTc5xW7XQ3qihIui6YHYDW00fa-6o/edit)
3. **Extensions → Apps Script**
4. Créez **un fichier Apps Script par `.gs`** (Extensions → Apps Script → **+** à côté de « Fichiers ») et copiez le contenu depuis `docs/admin-tresorerie/apps-script/` :

   | Fichier | Rôle |
   |---------|------|
   | `App.gs` | Routes API (doGet / doPost) |
   | `Auth.gs` | Login, session, rôles |
   | `PasswordReset.gs` | Mot de passe oublié (lien sécurisé) |
   | `Config.gs` | Constantes, whitelist, emails admin/trésoriers |
   | `Business.gs` | Demandes, factures, compta |
   | `SheetsRepo.gs` | Lecture / écriture Google Sheets |
   | `DriveService.gs` | **Upload factures et devis sur Drive** |
   | `EmailNotify.gs` | **Emails admin + trésoriers** |
   | `AccessRequests.gs` | Demandes d'accès adhérents |
   | `UserProfile.gs` | Prénom / nom profil |
   | `Setup.gs` | Migration onglets, setup initial |
   | `SheetFormatting.gs` | Couleurs et mise en forme Sheets *(optionnel pour l’API · utile pour le tableur)* |
   | `Reminders.gs` | Relances 24 h (trigger) |

   > **Souvent oubliés :** `EmailNotify.gs` et `DriveService.gs` — sans eux : pas d'emails, pas de pièces jointes Drive.
5. **Projet → Paramètres du projet → Propriétés du script** → repreneez `ScriptProperties.example.json` (vraies valeurs, jamais dans git)
6. Exécutez dans l'ordre :
   - `setupTresorerieSheets`
   - `setupDriveFolders` → notez `FACTURES_FOLDER_ID` affiché dans les logs
   - `setupUsersFromWhitelist`
   - `installAllTriggers` *(relances 24h + bascule auto 1er janvier)*
7. **Déployer → Nouvelle version → Application web**
   - Exécuter en tant que : **Moi**
   - Accès : **Toute personne**
8. Copiez l'URL se terminant par `/exec`

### Étape B · Site web (`.env.local`)

```env
VITE_TRESORERIE_API_URL=https://script.google.com/macros/s/…/exec
VITE_TRESORERIE_SPREADSHEET_ID=1VHVisgWvALpvj6xTc5xW7XQ3qihIui6YHYDW00fa-6o
VITE_TRESORERIE_DRIVE_FACTURES_ID=…
```

Redéployez le site Netlify après commit (sans `.env.local` — variables dans le dashboard hébergeur).

### Étape C · Partage Google

| Ressource | Partage |
|-----------|---------|
| Sheet 2026 | Lecteur lien (embed trésorier) · Éditeur trésoriers |
| Dossier Factures | Éditeur compte asso uniquement |
| Web App | Public URL (auth JWT côté script) |

---

## Usage adhérent

1. **Demande** (avant achat) → validation trésorier → email `AKUU-DEM-2026-NNNN`
2. **Facture** (après achat) → ref DEM + photo → Drive + Sheets
3. **Historique** → suivi statuts

### Règles

- Montant facture ≤ devis + **10 %** (moins = OK)
- **Toute dépense** → demande (devis) avant achat · dépense **> 1000 S/.** → joindre **2 photos/PDF** de devis fournisseurs
- Date achat prévu ≥ aujourd'hui

---

## Usage trésorier

- **Validation** : approuver/refuser demandes et factures (motif obligatoire si refus)
- **Compta** : iframe Google Sheet + liens Drive
- Emails automatiques à chaque action · relance 24 h si en attente

---

## Bascule annuelle (automatique)

Le **1er janvier à 6h** (Europe/Paris), le trigger `setupNewYearScheduled` :

- crée `Factures/AAAA/` et `Relevés de compte/AAAA/`
- initialise `DEM_COUNTER_AAAA` et `FAC_COUNTER_AAAA` à 0
- envoie un email récap aux trésoriers

**Aucun redeploiement** · même tableur · idempotent (1× par an).

Test manuel : exécuter `setupNewYear(2027)` ou `testSetupNewYear` dans l'éditeur.

---

## Trésorier de test (akuu.asso@gmail.com)

Pour tester la validation croisée (vous soumettez une demande · un autre trésorier approuve) :

1. Apps Script → copier `Setup.gs` à jour
2. Sélectionner **`setupTreasurerTestAkuuAsso`** → **Exécuter**
3. Consulter le journal : mot de passe provisoire envoyé à **akuu.asso@gmail.com**
4. Se connecter sur le site avec `akuu.asso@gmail.com` + ce mot de passe (onglet **Validation**)

Rôles recommandés en test :

| Compte | Rôle | Usage |
|--------|------|--------|
| yoannreyricord@gmail.com | admin | Soumettre demandes / factures |
| akuu.asso@gmail.com | trésorier | Valider dans **Validation** |
| francois.million.FM@gmail.com | trésorier | Production |

Manuel : `ensureTreasurerUser_('email@…', 'Nom affiché')` pour tout autre compte test.

---

## Dépannage

| Problème | Action |
|----------|--------|
| Embed sheet vide | Partager le tableur en lecture « lien » |
| 401 Session | Vérifier JWT_SECRET · reconnecter |
| Upload facture échoue | Vérifier FACTURES_FOLDER_ID |
| Email non autorisé | Ajouter dans WHITELIST_JSON + `setupUsersFromWhitelist` |
