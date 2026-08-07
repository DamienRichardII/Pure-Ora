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
| Portrait de Sheilla | 4:5 | Portrait vertical, lumière naturelle recommandée |

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

## Logo officiel Pure Ora

| Fichier | Usage |
|---|---|
| `assets/branding/pure-ora-logo-transparent.png` | Logo complet (monogramme + "Pure Ora"), fond transparent — usages génériques |
| `assets/branding/pure-ora-logo.png` | Logo complet, fond blanc — usages nécessitant un fond opaque |
| `assets/branding/pure-ora-monogram.png` | Monogramme seul (sans texte), fond transparent — utilisé dans le header (desktop + mobile), ratio compact adapté aux petites hauteurs |
| `assets/branding/pure-ora-google-512.png` | Logo complet, 512×512, fond blanc — référencé dans le JSON-LD `Organization.logo` |

Le monogramme header a été recadré à partir du fichier source officiel (aucune retouche du dessin lui-même) pour rester lisible aux hauteurs réduites d'un header ; le logo complet reste utilisé partout où l'espace le permet (Open Graph, données structurées).

## Image de partage (Open Graph)

| Média | Dimensions | Notes |
|---|---|---|
| `assets/social/pure-ora-og.jpg` | 1200×630 px | Visuel de marque officiel (monogramme + "Pure Ora"), utilisé pour `og:image` et `twitter:image` sur toutes les pages principales |

## Favicon

| Fichier | Dimensions |
|---|---|
| `favicon/favicon.ico` | multi-résolution (16, 32, 48, 256 px) |
| `favicon/favicon-16.png`, `favicon-32.png`, `favicon-48.png` | 16×16, 32×32, 48×48 |
| `favicon/apple-touch-icon.png` | 180×180 |
| `favicon/icon-192.png`, `icon-512.png` | 192×192, 512×512 (PWA / `manifest.json`) |

Ces fichiers utilisent désormais le monogramme officiel Pure Ora (recadré depuis le logo source, non retouché). L'ancien fichier `favicon/logo.jpeg` (source non optimisée, marges blanches importantes) n'est plus référencé nulle part et a été laissé en place sans usage actif.

## Formats et poids recommandés

- Images : WebP ou AVIF en priorité, JPEG en repli. Poids cible < 250 Ko par image de section, < 100 Ko pour les vignettes.
- Vidéos : H.264 (MP4), compression optimisée pour le web, poster image obligatoire.
- Toujours renseigner `width`, `height` et un texte alternatif (`alt`) descriptif sur chaque image.
