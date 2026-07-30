# Pure Ora — Site e-commerce statique

Site e-commerce éditorial de la marque **Pure Ora**, fondée par Sheila Mavinga. Vente de postiches semi-naturelles faciles à installer.

Site 100% statique : **HTML5, CSS3, JavaScript natif (ES6)**. Aucun framework, aucune base de données. Données centralisées dans des fichiers JSON (`data/`).

## Stack technique

- HTML5 sémantique
- CSS3 moderne (Grid, Flexbox, clamp(), aspect-ratio)
- JavaScript natif (modules ES6 implicites via scripts classiques + `window.PureOra*`)
- Fichiers JSON locaux (`data/products.json`, `settings.json`, `faq.json`, `reviews.json`, `shipping.json`)
- Paiement : Stripe Payment Links (aucune donnée bancaire traitée par ce site)
- Formulaires : endpoint externe configurable (Formspree, Web3Forms, EmailJS, Brevo…)
- Déploiement : Vercel (statique, sans build)

## Lancer le projet en local

Le chargement des composants HTML (`components/*.html`) et des fichiers JSON se fait via `fetch()`, qui nécessite un serveur local (le protocole `file://` seul ne fonctionne pas dans la plupart des navigateurs).

**Option 1 — Extension VS Code "Live Server"**
Ouvrir le dossier dans VS Code, clic droit sur `index.html` → "Open with Live Server".

**Option 2 — Serveur Python**
```bash
cd pure-ora
python -m http.server 8000
```
Puis ouvrir `http://localhost:8000`.

**Option 3 — Vercel CLI**
```bash
npm i -g vercel
vercel dev
```

## Arborescence

```
pure-ora/
├── index.html, boutique.html, produit.html, panier.html, commande.html,
│   confirmation.html, suivi-commande.html, a-propos.html, installation.html,
│   entretien.html, livraison.html, retours-remboursements.html, faq.html,
│   avis.html, contact.html, mentions-legales.html, cgv.html,
│   confidentialite.html, cookies.html, 404.html
├── css/ (variables, reset, global, components, animations, responsive, pages/*)
├── js/ (main, navigation, animations, products, product-page, cart, checkout,
│        filters, reviews, faq, forms, tracking, cookies)
├── data/ (products.json, settings.json, faq.json, reviews.json, shipping.json)
├── components/ (header, footer, announcement-bar, cart-drawer, cookie-banner)
├── assets/ (images, videos, icons, documents, fonts)
├── favicon/, robots.txt, sitemap.xml, manifest.json, vercel.json
```

## Modifier le contenu du site (sans toucher au code)

Toutes les données modifiables sont centralisées dans `data/*.json`. Ouvrez le fichier concerné avec un éditeur de texte, modifiez la valeur, enregistrez.

### Modifier le prix du produit
`data/products.json` → propriété `"price"` (nombre, ex. `39.90`) et `"compareAtPrice"` pour un prix barré facultatif. Tant que `"price"` vaut `null`, le site affiche "Prix à venir" partout automatiquement.

### Ajouter une photo
1. Déposez le fichier image dans `assets/images/products/` (ou le sous-dossier concerné).
2. Ajoutez son chemin dans le tableau `"images"` du produit concerné dans `data/products.json`.
Tant qu'une image est absente, un placeholder élégant s'affiche automatiquement (aucune image cassée).

### Remplacer la vidéo principale (hero)
Déposez votre fichier dans `assets/videos/hero-desktop.mp4` (le nom de fichier est déjà référencé dans `index.html`). Mettez à jour `assets/images/hero/hero-poster.jpg` pour l'image de secours.

### Modifier le texte du hero
Éditez directement le texte dans `index.html`, section `<!-- SECTION 1 — HERO VIDÉO -->` (label, titre `<h1>`, sous-titre, boutons).

### Changer les frais de livraison
`data/shipping.json` → propriété `"price"` de chaque zone (`france`, `kinshasa`). Tant que la valeur est `null`, le site affiche "Tarif de livraison communiqué lors de la commande".

### Ajouter un avis client
`data/reviews.json` → ajoutez un objet dans le tableau `"reviews"` avec `"status": "published"` et passez `"published": true` en tête de fichier pour rendre la section visible sur le site. Ne jamais publier de faux avis.

### Ajouter un produit
Dupliquez l'objet du produit existant dans `data/products.json`, changez `id`, `slug`, `name`, images, prix, etc. Il apparaîtra automatiquement dans la grille boutique (`boutique.html`).

### Changer le lien de paiement Stripe
`data/products.json` → propriété `"paymentLink"` du produit. Tant qu'elle est vide, les boutons "Commander maintenant" / "Achat immédiat" affichent un message d'information en environnement de développement au lieu de rediriger vers une fausse page.

### Modifier les réseaux sociaux, WhatsApp, e-mail
`data/settings.json` → objet `"contact"`. Le bouton WhatsApp flottant et le bouton e-mail de la page contact n'apparaissent que si un numéro/e-mail valide est renseigné.

### Remplacer le guide PDF d'entretien
Remplacez le fichier `assets/documents/guide-entretien-pure-ora.pdf` par le PDF définitif (même nom de fichier, ou mettez à jour le lien dans `data/settings.json` → `rituel.pdfGuideUrl` et dans `entretien.html`).

## Panier et paiement (fonctionnement statique)

Le panier est géré en `localStorage` (voir `js/cart.js`), sans backend. Le paiement est délégué à **Stripe Payment Links** : le bouton "Commander" redirige vers l'URL renseignée dans `paymentLink`.

**Limite connue** : un Payment Link Stripe correspond à une offre fixe. Pour un panier multi-produits/quantités, deux solutions :
1. **Solution simple (recommandée pour le lancement)** : créer un Payment Link par produit/offre principale dans le tableau de bord Stripe, et un lien "panier groupé" si nécessaire.
2. **Solution évolutive** : connecter ultérieurement le site à **Stripe Checkout** via une fonction serverless (Vercel Functions) qui construit dynamiquement la session à partir du contenu du panier. Cela nécessite d'ajouter une petite API et sort du périmètre strictement statique de cette version.

Le site ne collecte, n'affiche ni ne stocke jamais de numéro de carte, cryptogramme ou date d'expiration.

## Configuration des formulaires

Tous les formulaires (contact, newsletter, avis, réclamation) pointent vers `data/settings.json` → `forms.endpoint`. Tant que ce champ est vide, les formulaires restent pleinement validés côté navigateur mais n'envoient aucune donnée. Renseignez l'URL d'un service compatible (Formspree, Web3Forms, EmailJS, Brevo…) pour activer l'envoi réel. Ne jamais placer de clé secrète/privée dans le code JavaScript public — seules les clés publiques des services de formulaire statique sont conçues pour être exposées côté client.

## Configuration WhatsApp

`data/settings.json` → `contact.whatsapp` (numéro international sans espaces, ex. `33612345678`) et `contact.whatsappMessage`. Le bouton flottant n'apparaît que si un numéro est renseigné.

## Le Rituel Pure Ora (guide + vidéo privée)

Le PDF est servi depuis `assets/documents/`. La vidéo privée doit être hébergée sur une plateforme adaptée (Vimeo en mode privé, YouTube non répertorié…) et son lien renseigné dans `data/settings.json` → `rituel.privateVideoUrl`. **Important** : une URL même "non répertoriée" reste techniquement accessible à qui la possède — elle n'est pas protégée par une authentification. Il est recommandé de distribuer ce lien et le PDF principalement via l'e-mail de confirmation envoyé par Stripe/votre service d'e-mailing après achat, plutôt que de les rendre trouvables publiquement sur le site.

## SEO

Chaque page dispose d'un `<title>`, d'une meta description, de balises Open Graph/Twitter Card et d'une URL canonique. Des données structurées JSON-LD (Organization, WebSite, Product, FAQPage) sont injectées — uniquement pour du contenu réellement visible sur la page, sans prix ni disponibilité non confirmés. `robots.txt` et `sitemap.xml` sont fournis ; mettez à jour le domaine (`https://www.pureora.com`) partout où il apparaît une fois le nom de domaine définitif connu (voir aussi `data/settings.json` → `"domain"`).

## Déploiement GitHub

```bash
cd pure-ora
git init
git add .
git commit -m "Initial commit — site Pure Ora"
git branch -M main
git remote add origin <URL_DU_DEPOT_GITHUB>
git push -u origin main
```

## Déploiement Vercel

**Via l'interface Vercel** : "Add New Project" → importer le dépôt GitHub → Framework Preset : "Other" → aucune commande de build nécessaire → Deploy.

**Via la CLI** :
```bash
npm i -g vercel
vercel
vercel --prod
```

`vercel.json` active les URLs propres (`cleanUrls`) et les en-têtes de cache/sécurité recommandés.

## Connexion du nom de domaine

Dans le tableau de bord Vercel du projet : Settings → Domains → ajouter le domaine acheté, puis suivre les instructions DNS (enregistrement A ou CNAME selon le registrar). Mettre ensuite à jour `data/settings.json` (`"domain"`) et les URLs canoniques/Open Graph dans chaque page HTML.

## Tests effectués avant livraison

- Validation de la syntaxe de tous les fichiers JavaScript (`node --check`).
- Validation de tous les fichiers JSON.
- Vérification des liens internes entre les 20 pages et le footer/header.
- Vérification du panier (ajout, quantité, suppression, persistance localStorage).
- Vérification des formulaires (validation, honeypot, messages d'état).
- Vérification de la FAQ (accordéon, données structurées).
- Vérification du responsive à 320px, 375px, 768px, 1024px, 1440px.
- Vérification de l'absence d'erreurs de console sur un serveur local.

Voir aussi `CHECKLIST-AVANT-MISE-EN-LIGNE.md` pour les éléments restant à transmettre par la marque avant l'ouverture des commandes.
