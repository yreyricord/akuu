# Plan comptable & catégories — Bonnes pratiques SI Amazonie

> Inspiré des pratiques ONG / bailleurs : traçabilité par projet, pièce justificative, séparation engagement/validation ([abvius](https://abvius.org/fr/articles/justification-depenses-ong-guide-conformite-bailleurs), [guide procédures ONG](https://donnadieu-associes.fr/wp-content/uploads/2019/09/DA-guide-des-procedures-internes-ONG.pdf)).

AKUU reste association **loi 1901 France** avec missions **Pérou (Loreto)** · saisie terrain en **soles**.

---

## Axe 1 · Projet AKUU (obligatoire · 1 seul par ligne v1)

Aligné sur `finances-ag.json` :

| Code | Libellé |
|------|---------|
| `musee` | Musée Shapishiko |
| `maison` | Projet Maison communautaire |
| `akuuvision` | AKUUVision |
| `anglais` | Cours d'anglais |
| `hydrama` | Hydrama |
| `lowtech` | Low Tech |
| `dechets` | Gestion des déchets |
| `sensibilisation` | Sensibilisation |
| `fonctionnement` | Frais de fonctionnement |
| `divers` | Divers / non affecté |

---

## Axe 2 · Nature de dépense (obligatoire)

Catégories standard mission internationale / terrain amazonien :

| Code | Libellé | Exemples terrain |
|------|---------|------------------|
| `transport` | Transport & logistique | Bateau, moto-taxi, carburant, péage |
| `hebergement_resto` | Hébergement & restauration mission | Lodge, repas mission, cantine |
| `materiel` | Matériel & fournitures | Outils, quincaillerie, EPI, consommables |
| `equipement` | Équipement durable | Outillage, électroménager Casa |
| `communication` | Communication | Impression, affiches, réseaux |
| `services_locaux` | Services locaux & main d'œuvre | Artisan, guide, interprète, prestataire |
| `sante` | Santé & pharmacie | Pharmacie, urgence, antivenin |
| `batiment_travaux` | Bâtiment & travaux | Construction, réparation Casa/musée |
| `formation` | Formation & animation | Matériel pédagogique, atelier |
| `banque_frais` | Frais bancaires & change | Commission, retrait, frais virement |
| `admin_assurance` | Administratif & assurance | Assurance mission, visa, timbres |
| `autre` | Autre (justification obligatoire) | |

---

## Axe 3 · Type de flux financier (obligatoire · Q8)

| Valeur | Libellé UI | Comptabilité |
|--------|------------|--------------|
| `avance_benevole` | J'ai avancé l'argent (demande remboursement) | Créance sur asso |
| `avance_asso` | Avance trésorerie association | Sortie caisse asso |
| `carte_asso` | Payé carte bancaire AKUU | Débit compte asso |

---

## Axe 4 · Moyen de paiement (obligatoire)

Espèces · Carte bancaire · Virement · PayPal · Yape/Plin (Pérou) · Autre

---

## Champs obligatoires — Facture (Q11 · audit)

| Champ | Obligatoire |
|-------|-------------|
| Date de la dépense | Oui |
| Projet | Oui |
| Nature de dépense | Oui |
| Libellé descriptif | Oui |
| Montant PEN | Oui |
| Montant EUR | Auto |
| Taux EUR/PEN du jour | Auto |
| Type flux (avance bénévole / asso / carte) | Oui |
| Moyen de paiement | Oui |
| Nom du payeur (adhérent ou « AKUU ») | Oui |
| Référence demande validée (`AKUU-DEM-YYYY-NNNN`) | Oui |
| Photo ou PDF facture | Oui |
| Nom fournisseur / commerçant | Oui |
| N° facture / reçu (si existe) | Si disponible |
| Lieu (village, Nauta, Iquitos…) | Oui |
| Commentaire | Non |

---

## Champs obligatoires — Demande de dépense (avant achat)

| Champ | Obligatoire |
|-------|-------------|
| Projet | Oui |
| Nature | Oui |
| Montant estimé PEN | Oui |
| Description détaillée | Oui |
| Date besoin / achat prévu | Oui |
| Type flux prévu | Oui |
| Justification (lien activité projet) | Oui |

---

## Pièce justificative minimale (bonnes pratiques)

Pour qu’une facture soit **éligible** à validation trésorier :

1. Document lisible (photo nette ou PDF)
2. Date visible ou saisie cohérente
3. Montant PEN identifiable
4. Identité commerçant ou reçu nominatif
5. Lien avec demande préalable (`AKUU-DEM-…`) approuvée
6. Archivage Drive nommé : `YYYY-MM-DD_REF_MONTANTPEN.ext`

Réf. : [Justification dépenses ONG](https://abvius.org/fr/articles/justification-depenses-ong-guide-conformite-bailleurs)

---

## Q10 expliqué · Ventilation multi-projets

**Question :** une facture de 200 soles peut-elle être splitée 100 soles Musée + 100 soles Hydrama ?

**Décision v1 AKUU : NON** · une ligne = un projet.  
Si achat commun, le trésorier choisit le projet principal ou on fait **2 factures**.

Raison : simplicité terrain + export comptable · la ventilation multi-axes est une bonne pratique ONG avancée ([gestion multi-projets](https://abvius.org/fr/articles/gestion-multi-projets-ong-piloter-subventions-bailleurs)) · prévoir en v2 si besoin AG.
