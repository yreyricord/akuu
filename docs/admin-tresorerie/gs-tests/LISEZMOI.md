# Tests du backend Apps Script (hors Google)

Exécute les vrais fichiers `.gs` dans Node avec de faux Google Sheets / Drive / Cache.

```bash
cd akuu/docs/admin-tresorerie/gs-tests
node test-securite.cjs      # 47 contrôles : authentification, droits, fichiers, doublons, mots de passe
```
Tout doit afficher ✅. À relancer après chaque modification des fichiers `.gs`.
