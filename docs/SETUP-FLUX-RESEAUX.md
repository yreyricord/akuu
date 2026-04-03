# Flux Instagram & TikTok automatiques (Netlify)

Le site appelle la fonction serverless `/.netlify/functions/social-feed`, qui lit les API officielles. Les variables secrètes se configurent **uniquement** dans Netlify (pas dans le code).

Réglages du nombre de posts : `src/data/reseaux-association.json` → `feed.instagramLimit` et `feed.tiktokLimit`.

---

## Partie A — Instagram (recommandé en premier)

### A1. Prérequis

1. Compte Instagram **Professionnel** : **Entreprise** ou **Créateur** (pas un compte perso « simple »).
2. Ce compte Instagram doit être **connecté à une Page Facebook** (Meta Business Suite ou paramètres Instagram).
3. Tu dois pouvoir te connecter au [Meta for Developers](https://developers.facebook.com/) avec un compte Meta autorisé sur cette Page.

### A2. Créer une application Meta

1. Va sur [developers.facebook.com](https://developers.facebook.com/) → **Mes applications** → **Créer une application**.
2. Choisis un type adapté au **business** (ex. **Entreprise** ou **Autre** selon les options proposées).
3. Note l’**ID de l’application** (facultatif pour notre usage direct).

### A3. Ajouter le produit « Facebook Login » (souvent le plus simple)

1. Dans le tableau de bord de l’app → **Ajouter un produit** → **Facebook Login** → **Configurer**.
2. Dans **Paramètres** → **Facebook Login** → **Paramètres client OAuth**, tu peux laisser les URI de redirection par défaut pour les tests, ou ajouter l’URL de ton site Netlify si demandé.

### A4. Récupérer un jeton avec les bonnes permissions

1. Ouvre l’[**Explorateur d’API Graph**](https://developers.facebook.com/tools/explorer/).
2. En haut, sélectionne **ta Meta app** (celle créée à l’étape A2).
3. Clique sur **Obtenir un jeton d’accès** → **Obtenir un jeton d’accès utilisateur** (ou Page selon ce que propose l’outil).
4. Coche au minimum les permissions utiles pour lire les médias de la Page / Instagram lié, par exemple (les libellés peuvent varier légèrement) :
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic` ou équivalent **Instagram** pour la lecture du profil / médias du compte professionnel lié  
   Consulte la doc Meta actuelle pour **Instagram Graph API** si un nom a changé.
5. Génère le jeton et **copie-le** (court, pour l’instant).

### A5. Obtenir un jeton Page **longue durée** (important pour Netlify)

Les jetons utilisateur expirent vite. Pour la prod, Meta permet d’échanger le jeton vers un **jeton d’accès longue durée** pour une **Page** :

1. Suis la documentation officielle : [Jetons d’accès longue durée de Page](https://developers.facebook.com/docs/facebook-pages/access-tokens/#long-lived-page-access-token) (section qui explique l’échange à partir d’un jeton utilisateur de courte durée).
2. Le résultat attendu est un **`INSTAGRAM_ACCESS_TOKEN`** qui est en pratique un **jeton d’accès de Page** valable **plusieurs semaines** (puis à renouveler).

> Si l’app est en mode **Développement**, seuls les rôles de l’app (admin, testeur, etc.) peuvent utiliser le flux. Pour le grand public, Meta peut exiger une **révision d’app** selon les permissions.

### A6. Trouver les IDs à mettre dans Netlify

Tu as besoin de **`INSTAGRAM_ACCESS_TOKEN`** (jeton Page longue durée) **et** d’**un** des deux :

| Variable | Description |
|----------|-------------|
| `FACEBOOK_PAGE_ID` | ID numérique de la **Page Facebook** liée au compte Instagram (souvent visible dans *À propos* de la Page ou via l’Explorateur d’API : `me/accounts`). **Recommandé** si tu ne trouves pas l’ID Instagram. |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ID numérique du **compte Instagram professionnel** côté Graph API (souvent 10–17 chiffres). Tu peux l’obtenir avec une requête du type : `/{page-id}?fields=instagram_business_account` avec ton jeton Page. |

Le code Netlify : si `INSTAGRAM_BUSINESS_ACCOUNT_ID` est vide, il utilise `FACEBOOK_PAGE_ID` + le jeton pour récupérer automatiquement l’ID Instagram.

### A7. Variables dans Netlify

1. Netlify → ton site → **Site configuration** → **Environment variables**.
2. Ajoute (valeurs secrètes, **ne pas** commit dans Git) :
   - `INSTAGRAM_ACCESS_TOKEN` = jeton Page longue durée  
   - `FACEBOOK_PAGE_ID` **ou** `INSTAGRAM_BUSINESS_ACCOUNT_ID`
3. **Enregistrer**, puis **Déployer** à nouveau le site (**Deploys** → **Trigger deploy**), pour injecter les variables dans les fonctions.

### A8. Tester

Dans un navigateur ou avec `curl` (remplace l’URL par ton domaine Netlify) :

```text
https://TON-SITE.netlify.app/.netlify/functions/social-feed?instagramLimit=3
```

Tu dois voir du JSON avec un tableau `instagram` non vide et éventuellement `meta` (erreurs éventuelles côté API).

---

## Partie B — TikTok (optionnel, plus technique)

### B1. Application TikTok

1. [TikTok for Developers](https://developers.tiktok.com/) → créer une application.
2. Activer **Login Kit** et/ou les APIs nécessaires pour accéder à la liste des vidéos du compte autorisé.
3. Le scope **`video.list`** est requis pour l’endpoint utilisé par le site ([doc List Videos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list/)).

### B2. Jeton d’accès utilisateur

L’API attend un **`TIKTOK_ACCESS_TOKEN`** (Bearer) obtenu par **OAuth 2.0** : l’utilisateur (le compte `@akuu_asso`) doit autoriser l’app.  
En pratique :

- En phase de test, tu peux utiliser les outils / flux OAuth du portail développeur pour obtenir un jeton **temporaire**.
- Les jetons **expirent** ; pour de la prod il faudrait un flux de **rafraîchissement** (refresh token) dans une fonction dédiée — non inclus dans ce dépôt pour l’instant.

### B3. Variable Netlify

- `TIKTOK_ACCESS_TOKEN` = le Bearer valide au moment du déploiement / des appels.

Sans cette variable, la section TikTok reste sur les **replis** (liens / URLs manuelles dans `reseaux-association.json`).

---

## Accès refusé sur developers.facebook.com

Si tu vois **« You don’t have access — This feature isn't available to you yet »** (ou l’équivalent en français), c’est une **restriction du compte Meta** : le site AKUU ne peut pas la lever.

**Pistes :** vérifier téléphone / e-mail du compte Facebook, attendre quelques jours si le compte est neuf, essayer avec le compte d’une autre personne **admin de la Page Facebook** de l’asso, ou consulter l’aide Meta. **Tant que ce blocage existe**, l’API Instagram officielle (option 2) n’est pas utilisable : passe par les **embeds manuels** (`reseaux-association.json`) ou un **widget tiers** qui gère Meta pour toi.

---

## Dépannage

| Symptôme | Piste |
|----------|--------|
| Toujours les cartes « Ouvrir Instagram » | Variables absentes ou mauvaises ; ou déploiement sans redémarrage après ajout des variables. |
| JSON avec `meta.instagramError` | Message Meta (permissions, jeton expiré, compte non pro, Page non liée). |
| Erreur 403 / App non visible | App en mode développement : ajouter ton compte comme testeur, ou passer par la révision Meta. |
| Ça marche en prod mais pas en `npm run dev` | Normal : en local, ajoute dans `.env.local` : `VITE_NETLIFY_FUNCTIONS_ORIGIN=https://ton-site.netlify.app` pour pointer vers la fonction déployée. |

Pour toute évolution légale / CGU Meta et TikTok, vérifie les conditions d’utilisation des API et l’usage des données affichées sur le site.
