# Guide de contenus — Pure Ora

Formats et dimensions recommandés pour chaque média du site. Respecter ces ratios évite tout décalage de mise en page (CLS) à l'ajout des médias définitifs.

## Vidéos

| Média | Ratio | Recommandation |
|---|---|---|
| Vidéo hero desktop | 16:9 | 1920×1080, MP4 (H.264), < 8 Mo idéalement, `muted`, `playsinline` |
| Vidéo hero mobile | 9:16 ou 4:5 | Déclinaison verticale optionnelle, fichier séparé et plus léger |
| Vidéo d'installation | 16:9 | Chapitrée si possible, sous-titrée, hébergement privé recommandé |
| Vidéo privée "Rituel Pure Ora" | 16:9 ou 9:16 | Hébergement Vimeo privé / YouTube non répertorié |

## Photos produit

| Média | Ratio | Notes |
|---|---|---|
| Photo produit (face/dos/profil) | 4:5 | Fond neutre, lumière homogène |
| Détail fibre / clips / tirette | 1:1 | Gros plan net |

## Portrait de la fondatrice

| Média | Ratio | Notes |
|---|---|---|
| Portrait de Sheila | 4:5 | Portrait vertical, lumière naturelle recommandée |

## Avant / Après

| Média | Ratio | Notes |
|---|---|---|
| Photo "Avant" et "Avec Pure Ora" | 4:5 (identique pour les deux) | Même cadrage, même luminosité, aucune retouche trompeuse |

## Galerie éditoriale / coiffures

| Média | Ratio | Notes |
|---|---|---|
| Galerie éditoriale | Mélange 3:4, 4:5, 1:1 | Cohérence de lumière et de tonalité colorimétrique |

## Avis clients

| Média | Ratio | Notes |
|---|---|---|
| Photo jointe à un avis (facultative) | 1:1 | Uniquement des photos authentiques fournies par de vraies clientes |

## Image de partage (Open Graph)

| Média | Dimensions | Notes |
|---|---|---|
| `assets/images/social/og-image.jpg` | 1200×630 px | Une version de démonstration est déjà fournie ; à remplacer par un visuel de marque définitif |

## Favicon

| Fichier | Dimensions |
|---|---|
| `favicon/favicon.ico` | multi-résolution (16, 32, 48, 64 px) |
| `favicon/favicon-16.png`, `favicon-32.png` | 16×16, 32×32 |
| `favicon/apple-touch-icon.png` | 180×180 |
| `favicon/icon-192.png`, `icon-512.png` | 192×192, 512×512 (PWA / `manifest.json`) |

Des icônes de démonstration (monogramme "PO") sont déjà en place. Remplacez-les par le logo définitif de Pure Ora dès qu'il sera disponible, en conservant les mêmes noms de fichiers.

## Formats et poids recommandés

- Images : WebP ou AVIF en priorité, JPEG en repli. Poids cible < 250 Ko par image de section, < 100 Ko pour les vignettes.
- Vidéos : H.264 (MP4), compression optimisée pour le web, poster image obligatoire.
- Toujours renseigner `width`, `height` et un texte alternatif (`alt`) descriptif sur chaque image.
