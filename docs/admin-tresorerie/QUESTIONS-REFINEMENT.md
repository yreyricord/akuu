# 20 questions de cadrage — Admin trésorerie AKUU

> Répondez directement sous chaque question (ou en bloc numéroté).  
> Vos réponses alimentent `PROMPT-CLAUDE.md` avant implémentation.

---

## A · Accès & utilisateurs

### 1. Qui peut se connecter ?
- [ ] Uniquement le bureau (CA / trésoriers / présidente)
- [ ] Tous les adhérents AKUU
- [ ] Bénévoles en mission seulement
- [ ] Autre : ___________

### 2. Combien de comptes trésorier ?
Co-trésoriers actuels : faut-il **2 comptes treasurer** avec les mêmes droits, ou un seul compte partagé ?

### 3. Comment créer les comptes au départ ?
- [ ] Liste email fixe en config (whitelist)
- [ ] Invitation par un admin
- [ ] Compte Google Workspace @akuu uniquement
- [ ] Autre : ___________

### 4. Mot de passe ou connexion Google ?
Le site n'a pas d'auth aujourd'hui. Préférez-vous login **email/mot de passe**, **Google Sign-In** (compte asso), ou les deux ?

---

## B · Workflow dépenses

### 5. Différence entre « demande de dépense » et « ajouter une facture » ?
Confirmez le flux :
- **Demande** = avant d'acheter (« je veux dépenser 200 soles pour X, ok ? »)
- **Facture** = après achat avec photo (« voici la preuve, remboursez-moi / comptabilisez »)

Ou les deux fusionnés en un seul formulaire avec statuts ?

### 6. La checkbox « validé amont avec le trésorier »
- Est-ce **obligatoire** pour soumettre une facture ?
- Que se passe-t-il si cochée mais le trésorier conteste ?
- Faut-il le **nom du trésorier** ou une **date de validation orale** ?

### 7. Dépenses en euros (France) ET en soles (Pérou) ?
- Saisie **soles uniquement** comme indiqué, ou les deux devises ?
- Si soles : conversion EUR automatique (taux BCE / saisie manuelle) pour le bilan FR ?

### 8. Remboursement bénévole vs paiement direct asso
Faut-il distinguer :
- « J'ai avancé l'argent, je demande remboursement »
- « La asso a payé, je dépose juste la facture »
- « À payer par la asso » (demande avant achat)

---

## C · Catégories comptables

### 9. Liste des catégories de dépense
Reprendre **exactement** les catégories de `finances-ag.json` / Excel existant, ou une liste simplifiée pour le terrain ?

Proposition à valider / corriger :
- Projet (Musée, Hydrama, AKUUVision, Maison, Anglais, Déchets, Low Tech, Divers)
- Nature (Transport, Matériel, Restauration, Hébergement, Communication, Banque, Admin, Autre)

### 10. Une dépense peut-elle être ventilée sur 2 projets ?
Ex. 50 % Musée / 50 % Fonctionnement — ou toujours **un seul** projet ?

### 11. Champs obligatoires pour le trésorier (bilan / audit)
Au-delà de montant + catégorie + photo, quels champs sont **non négociables** pour votre expert-comptable ou AG ?
(N° facture, SIRET fournisseur, TVA, mode de règlement, justificatif virement…)

---

## D · Google Drive & Excel

### 12. Avez-vous déjà un Google Drive / Sheets AKUU ?
- URL ou structure dossiers actuelle ?
- Le fichier `Synthese_financiere_AKUU_2017_2026.xlsx` est-il sur Drive ou en local uniquement ?

### 13. Structure dossier Drive souhaitée
Exemple :
```
AKUU Compta /
  2026 /
    Factures /
      2026-09-28_Hydrama_150-PEN_resto.jpg
```
Validez ou proposez autre arborescence.

### 14. Google Sheets vs Excel `.xlsx`
- **Sheets en ligne** (append automatique facile) puis export Excel pour trésorier ?
- Ou **Excel fichier fixe** sur Drive (plus fragile en écriture concurrente) ?
- Faut-il **2 onglets** : « Demandes en attente » + « Dépenses validées » ?

### 15. Qui possède le compte Google technique ?
Compte perso trésorier, compte `association@...`, ou Google Workspace AKUU ? (Important pour Apps Script.)

---

## E · Validation trésorier

### 16. Notifications
Comment le trésorier est-il alerté ?
- [ ] Email à chaque demande
- [ ] Résumé hebdomadaire
- [ ] Uniquement en se connectant à l'admin
- [ ] Slack / WhatsApp (préciser)

### 17. Délai et relances
Faut-il un statut « en attente depuis X jours » + relance auto ?

### 18. Refus d'une dépense
Motif obligatoire ? Notification email au demandeur ? Possibilité de **resoumettre** corrigée ?

### 19. Historique et traçabilité
Faut-il conserver **toutes** les versions (demande initiale, refus, resoumission) pour l'AG / audit ?

---

## F · Sécurité & périmètre v1

### 20. Périmètre de la v1 (MVP)
Cochez ce qui doit être dans la **première version livrée** :

- [ ] Login admin
- [ ] Onglet « Ajouter une facture »
- [ ] Onglet « Demande de dépense »
- [ ] Dashboard trésorier (valider / refuser)
- [ ] Upload photo → Google Drive
- [ ] Ligne auto → Google Sheets / Excel
- [ ] Liste « mes demandes » pour le bénévole
- [ ] Export CSV pour expert-comptable
- [ ] Lien avec page `/comptes-ag` (mise à jour auto des graphiques)
- [ ] App mobile-friendly (mission Pérou)

**Deadline ou événement cible** (AG, clôture comptable…) : ___________

---

## Bonus (optionnel)

- Budget plafond par projet visible avant validation ?
- Pièces jointes multiples (facture + ticket CB) ?
- Signature électronique trésorier ?
- RGPD : durée conservation factures ?
