# Checklist avant mise en ligne — Pure Ora

À valider avec Sheilla Mavinga avant l'ouverture officielle des commandes.

## Contenu produit
- [ ] Prix final renseigné (`data/products.json` → `price`)
- [ ] Lien de paiement Stripe renseigné (`data/products.json` → `paymentLink`)
- [ ] Stock / statut de disponibilité à jour (`stockDisplay`, `status`)
- [ ] Photos produit finales ajoutées (`assets/images/products/`)
- [ ] Vidéos finales ajoutées (hero, installation, rituel privé)

## Contenu de marque
- [ ] Histoire de Sheilla Mavinga rédigée et intégrée (`a-propos.html`, section À propos de l'accueil)
- [ ] Texte de la section "Plus qu'une coiffure, un rituel pour soi" validé ou remplacé (`index.html`)
- [ ] Avis clients authentiques ajoutés et validés (`data/reviews.json`, `"published": true`)
- [ ] Portrait(s) de la fondatrice ajoutés
- [ ] Galerie éditoriale et coiffures finalisées ou retirées si non confirmées

## Futurs univers de marque
- [ ] Date ou fenêtre de lancement des wigs communiquée (`wigs.html`)
- [ ] Date ou fenêtre de lancement des soins capillaires communiquée (`soins-capillaires.html`)
- [ ] Références et informations réglementaires des compléments alimentaires fournies avant toute mise en vente (`complements-alimentaires.html`)
- [ ] Date ou fenêtre de lancement des accessoires communiquée (`accessoires.html`)
- [ ] Premiers articles réels du Journal Pure Ora ajoutés ou existants validés (`journal.html`)

## Livraison
- [ ] Frais de livraison France ajoutés (`data/shipping.json`)
- [ ] Frais de livraison Kinshasa ajoutés (`data/shipping.json`)
- [ ] Transporteur confirmé et mentionné sur `livraison.html`

## Contact
- [ ] Numéro WhatsApp ajouté (`data/settings.json` → `contact.whatsapp`)
- [ ] Adresse e-mail de contact ajoutée (`data/settings.json` → `contact.email`)
- [ ] Endpoint de formulaire configuré (`data/settings.json` → `forms.endpoint`)

## Juridique
- [ ] Informations légales complétées (`mentions-legales.html` : SIRET, adresse, hébergeur…)
- [ ] CGV validées par un professionnel du droit (`cgv.html`)
- [ ] Politique de confidentialité validée (`confidentialite.html`)
- [ ] Politique de retours et remboursements validée juridiquement (`retours-remboursements.html`)

## Tests techniques
- [ ] Paiement testé de bout en bout (mode test puis réel Stripe)
- [ ] Tous les formulaires testés avec l'endpoint réel
- [ ] Affichage mobile vérifié (320px à 430px minimum)
- [ ] Tous les liens du site vérifiés (aucun lien mort)
- [ ] Console navigateur vérifiée (aucune erreur)

## Mise en ligne
- [ ] Nom de domaine acheté et connecté sur Vercel
- [ ] URLs canoniques et Open Graph mises à jour avec le domaine définitif
- [ ] Outils d'analyse configurés si souhaité (`data/settings.json` → `analytics`, dans le respect du consentement cookies)
- [ ] Favicon et image de partage définitifs ajoutés
- [ ] Sauvegarde du dépôt Git effectuée (dépôt GitHub à jour)
