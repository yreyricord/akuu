# Site web AKUU

Site vitrine de l’association **AKUU** (solidarité Amazonie — France), multilingue (français, anglais, espagnol). Application **Vue 3** + **Vite**, styles **Tailwind CSS**, hébergement et déploiement sur **Netlify**.

---

## Prérequis

- **Node.js** 18+ (recommandé : LTS)
- **npm**

## Installation et développement local

```bash
npm install
npm run dev
```

Le script `dev` régénère les fichiers SEO (`public/robots.txt`, `public/sitemap.xml`) et synchronise la liste des images de la galerie musée avant de lancer Vite.

- **URL locale** : en général `http://localhost:5173`

### Autres commandes utiles

| Commande | Rôle |
|----------|------|
| `npm run build` | Build de production (`dist/`) — exécute aussi les contrôles i18n et narratives en prébuild |
| `npm run preview` | Prévisualiser le build localement |
| `npm run i18n:check` | Vérifie que les clés `fr` / `en` / `es` sont alignées |
| `npm run seo:files` | Régénère `robots.txt` et `sitemap.xml` (voir variable `VITE_SITE_URL` ci-dessous) |
| `npm run musee:gallery` | Met à jour `src/data/musee-gallery.json` à partir des images dans `public/images/musee/` |

---

## Structure du dépôt (aperçu)

- `src/` — application Vue (vues, composants, routeur, i18n, données JSON)
- `public/` — assets statiques et images
- `scripts/` — génération SEO, sync galerie, contrôles i18n
- `netlify/` — fonctions serverless (`social-feed`, etc.)
- `docs/SETUP-FLUX-RESEAUX.md` — configuration détaillée du flux Instagram / TikTok via Netlify

---

## Déploiement Netlify

Le fichier [`netlify.toml`](netlify.toml) définit :

- **Build** : `npm run build`
- **Dossier publié** : `dist`
- **SPA** : redirection `/*` → `/index.html` (historique du routeur côté client)
- **Fonctions** : répertoire `netlify/functions/`

### Branchement du dépôt GitHub

1. Dans Netlify : **Add new site** → importer le dépôt GitHub.
2. Laisser la commande de build et le répertoire de publication tels que dans `netlify.toml` (ou équivalent dans l’UI).
3. Déployer : chaque push sur la branche configurée déclenche un nouveau build.

### Variables d’environnement importantes

À configurer dans **Site configuration → Environment variables** (Netlify) :

| Variable | Usage |
|----------|--------|
| `VITE_SITE_URL` | URL canonique du site **avec** le schéma, sans slash final (ex. `https://www.akuu.org`). Sert au **sitemap**, **robots.txt**, balises **Open Graph**, **JSON-LD** et origine du site dans le code (`src/config/site.js`). |
| `VITE_NETLIFY_FUNCTIONS_ORIGIN` | Optionnel en **local** : URL du site déployé (ex. `https://www.akuu.org`) pour que le front appelle les fonctions Netlify (ex. flux réseaux sociaux) pendant `npm run dev`. |
| Variables du flux social | Voir [`docs/SETUP-FLUX-RESEAUX.md`](docs/SETUP-FLUX-RESEAUX.md) (`INSTAGRAM_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, etc.). |

Sans `VITE_SITE_URL` au build, les scripts SEO utilisent par défaut `https://www.akuu.org` (voir `scripts/generate-seo-files.mjs`).

### Formulaire de contact (Netlify Forms)

Le formulaire de contact est compatible **Netlify Forms** (attributs `data-netlify`, honeypot anti-spam). Un formulaire fantôme est aussi présent dans `index.html` pour la détection par Netlify sur une SPA. Les soumissions sont visibles dans l’interface Netlify (**Forms**).

---

## GreenGeeks, ImprovMX et Netlify : comment ça s’articule

Ce sont **trois rôles différents** : nom de domaine / DNS, **réception** des e-mails, **hébergement** du site. Ils ne se remplacent pas ; ils se complètent via la **zone DNS** du domaine (souvent gérée chez GreenGeeks si le domaine y est enregistré).

### GreenGeeks (domaine et DNS)

**GreenGeeks** sert en général à :

- **Enregistrer** le nom de domaine (ex. `akuu.org`) et/ou héberger un hébergement classique.
- **Gérer la zone DNS** du domaine : c’est là qu’on indique aux internautes et aux services où pointent le **site web** et la **messagerie**.

Pour un site statique sur Netlify, on **ne met pas** le site sur l’hébergement mutualisé GreenGeeks : on utilise uniquement le DNS pour **pointer le domaine vers Netlify**.

**À faire côté DNS GreenGeeks** (les valeurs exactes sont fournies par Netlify après ajout du domaine personnalisé au site) :

- **Sous-domaine `www`** : enregistrement de type **CNAME** vers l’URL Netlify du site (ex. `something.netlify.app` ou la cible indiquée par Netlify).
- **Domaine nu (apex)** `akuu.org` : selon Netlify, utiliser les enregistrements **A** / **AAAA** indiqués, ou un **ALIAS** / **ANAME** si le panneau GreenGeeks le propose — toujours en suivant la documentation Netlify « [Configure external DNS for a custom domain](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/) ».

Une fois la propagation DNS terminée, Netlify peut délivrer le certificat **HTTPS** (Let’s Encrypt) pour `akuu.org` et `www.akuu.org`.

### ImprovMX (e-mails `@akuu.org`)

**ImprovMX** est un service de **réacheminement** (forward) : il ne héberge pas une boîte complète comme Gmail, mais reçoit les messages envoyés à `contact@akuu.org` (ou autre alias) et les **transfère** vers une ou plusieurs adresses personnelles.

**À faire :**

1. Créer un compte ImprovMX et ajouter le domaine `akuu.org`.
2. ImprovMX indique des enregistrements **MX** (et parfois un enregistrement **TXT** pour vérifier le domaine ou le SPF).

**Dans la zone DNS GreenGeeks**, ajouter ces enregistrements **MX** (priorités et hôtes fournis par ImprovMX, typiquement `mx1.improvmx.com` et `mx2.improvmx.com`).  
Ils coexistent avec les enregistrements **web** (A/CNAME vers Netlify) : le DNS route le **trafic web** vers Netlify et le **trafic SMTP** vers ImprovMX.

**À ne pas confondre :**

- **ImprovMX** : quelqu’un envoie un mail **à** `contact@akuu.org` → ImprovMX le forward vers votre boîte.
- **Netlify Forms** : le visiteur remplit le formulaire sur le site → Netlify enregistre la soumission dans le tableau de bord (et peut envoyer des notifications selon la config Netlify). Ce n’est pas le même canal qu’ImprovMX.

### Netlify (site en ligne)

- **Build** du dépôt → dossier `dist` servi en **CDN**.
- **Domaine** : domaine personnalisé + HTTPS gérés dans Netlify une fois le DNS correct.
- **Forms** : soumissions du formulaire de contact.
- **Functions** : API légère (ex. agrégation Instagram/TikTok).

En résumé :

```text
Visiteur → DNS (GreenGeeks) → enregistrements web → Netlify (site Vue)
Courriel vers @akuu.org → DNS (GreenGeeks) → MX ImprovMX → transfert vers votre boîte
```

---

## Licence et contact

Projet interne à l’association AKUU. Pour toute question technique liée au dépôt, s’adresser aux mainteneurs du projet sur GitHub.

Pour contacter l’association : **contact@akuu.org** (voir site public).
