# PROMPT MAÎTRE — Espace admin trésorerie AKUU

> **Statut :** ✅ VALIDÉ · prêt pour implémentation  
> **Dossier :** `docs/admin-tresorerie/`  
> **Repo :** `/Users/yreyricord/akuu/akuu`

---

## Instructions pour Claude

Tu es un ingénieur full-stack senior. Implémente l'**espace admin trésorerie AKUU** de bout en bout.

**Lis dans l'ordre :**
1. `docs/admin-tresorerie/04-reponses-fondateur-validees.md` ← **spec figée**
2. `docs/admin-tresorerie/03-spec-api.md` ← **API + Sheets + workflow**
3. `docs/admin-tresorerie/05-plan-comptable-categories.md` ← **catégories + champs**
4. `docs/admin-tresorerie/01-contexte-existant.md`
5. `src/data/finances-ag.json` (grep projets uniquement)

**Commence immédiatement.** Phase 0 → 1 → 2 → 3.

---

## 2. Réponses fondateur (VALIDÉES)

```
Q1  Accès : Adhérents (whitelist email)
Q2  Trésoriers : 2 comptes, rôle treasurer
Q3  Comptes : whitelist email (config)
Q4  Auth : email/mot de passe ET Google Sign-In
Q5  Flux : deux flux distincts (demande avant · facture après)
Q6  Validé amont : OBLIGATOIRE · référence AKUU-DEM-… envoyée par email à l'approbation
Q7  Devises : PEN seulement · EUR auto (taux du jour)
Q8  Typologie : avance_benevole | avance_asso | carte_asso
Q9  Catégories : bonnes pratiques SI Amazonie (doc 05)
Q10 Multi-projets : NON v1 · une dépense = un projet
Q11 Audit : champs doc 05 · pièces justificatives ONG
Q12 Drive : https://drive.google.com/drive/folders/1hAisydbVLOWUztBxi6XRCeGlrb8vBeSX
    ID : 1hAisydbVLOWUztBxi6XRCeGlrb8vBeSX
Q13 Arborescence : Factures/ · Relevés de compte/ · Comptes/ (Sheets)
Q14 Tableur : Google Sheets (onglets Demandes, Factures, Journal, Audit, Config)
Q15 Compte Google : akuu.asso@gmail.com
Q16 Notifications : email trésoriers
Q17 Relances : toutes les 24h (trigger Apps Script)
Q18 Refus : motif obligatoire · resoumission avec historique
Q19 Historique : OUI · onglet Audit
Q20 MVP : TOUT (login, demande, facture, validation, Drive, Sheets, mobile, export AG)
```

---

## 3. Architecture retenue

**Google Apps Script Web App** sous `akuu.asso@gmail.com` + **Vue admin** sur site statique.

Voir `03-spec-api.md` pour endpoints, onglets Sheets, workflow, nommage Drive.

---

## 4. Règles métier critiques

1. **Facture sans référence demande approuvée = rejetée**
2. **Référence format** `AKUU-DEM-YYYY-NNNN` · email sujet contient la ref
3. **Montant EUR** = PEN × taux jour (API ECB/Frankfurter · cache 24h)
4. **2 trésoriers** · les deux reçoivent emails et relances
5. **Historique complet** · resoumission crée nouvelle version liée
6. **Mobile-first** · capture photo facture depuis Pérou

---

## 5. Phases d'implémentation

### Phase 0 · Spec (1 tour)
- Vérifier `03-spec-api.md` · créer `apps-script/` dans docs

### Phase 1 · Frontend Vue
- Routes `/admin/*` · Pinia auth · formulaires · validation client
- Mock API ou stub jusqu'à Phase 2

### Phase 2 · Apps Script + Google
- Créer structure dossiers Drive dans 2026_NEW_Protocol
- Créer Spreadsheet + onglets
- Deploy Web App · connecter frontend

### Phase 3 · Durcissement
- Trigger relances 24h
- Export Journal → pipeline comptes AG
- `GUIDE-TRESORIER.md`
- `.env.example` · `whitelist-emails.example.txt`

---

## 6. Definition of Done

Tous les items Q20 cochés · tests manuels scénario complet :

1. Adhérent login → demande 200 PEN Hydrama transport
2. Trésorier approve → email ref `AKUU-DEM-2026-0001`
3. Adhérent soumet facture avec ref + photo → Drive + Sheets
4. Trésorier validate → Journal
5. Trésorier reject resoumission → historique Audit
6. Relance 24h testée

---

## 7. Secrets

- **Jamais** commit JWT_SECRET · mots de passe · clés OAuth
- `.gitignore` : `.env.local`, `ScriptProperties.json`

---

*Brief AKUU · Admin trésorerie · validé septembre 2026*
