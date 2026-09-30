# Migration Zeroheight → Supernova (Trampoline)

Source : Zeroheight styleguide **Trampoline** (id `135681`) — https://zeroheight.com/6f840074f/p/338212-trampoline
Cible : Supernova, via le MCP custom `https://mcp.supernova.io/mcp`.

## Étape 0 — MCP Supernova

Statut : **bloqué**. Deux prérequis côté utilisateur :
1. Ajouter le connecteur custom `https://mcp.supernova.io/mcp` sur https://claude.ai/customize/connectors (auth OAuth Supernova).
2. Autoriser le domaine `mcp.supernova.io` (et `*.supernova.io`) dans le Network access de l'environnement cloud.

Puis démarrer une nouvelle session (les connecteurs sont chargés au démarrage).

## Étape 1 — Pages à créer (groupe « Components »)

Chaque page reçoit deux onglets : **Description** et **How to use**.

| # | Composant | Zeroheight page id | URL Zeroheight | Statut Supernova |
|---|-----------|-------------------|----------------|------------------|
| 1 | Alert | 8315511 | https://zeroheight.com/6f840074f/v/latest/p/41fad3 | Contenu prêt (`pages/alert.md`) |
| 2 | Badge *(masquée)* | 7827251 | https://zeroheight.com/6f840074f/v/latest/p/475dab | À créer |
| 3 | Button & Icon button | 7750764 | https://zeroheight.com/6f840074f/v/latest/p/75ed99 | À créer |
| 4 | Breadcrumb | 8545960 | https://zeroheight.com/6f840074f/v/latest/p/762233 | À créer |
| 5 | Card | 7885990 | https://zeroheight.com/6f840074f/v/latest/p/10b2bf | À créer |
| 6 | Collapsible | 8542418 | https://zeroheight.com/6f840074f/v/latest/p/505efc | À créer |
| 7 | Command menu | 8691346 | https://zeroheight.com/6f840074f/v/latest/p/562738 | À créer |
| 8 | Data Table | 8317640 | https://zeroheight.com/6f840074f/v/latest/p/97fe29 | À créer |
| 9 | Dialog | 8323193 | https://zeroheight.com/6f840074f/v/latest/p/97a451 | À créer |
| 10 | Description group | 8708656 | https://zeroheight.com/6f840074f/v/latest/p/481b1c | À créer |
| 11 | Drawer | 8769161 | https://zeroheight.com/6f840074f/v/latest/p/372e7d | À créer |
| 12 | Dropdown Menu | 7931801 | https://zeroheight.com/6f840074f/v/latest/p/990f9b | À créer |
| 13 | Empty | 8630828 | https://zeroheight.com/6f840074f/v/latest/p/818d05 | À créer |
| 14 | Field | 7968577 | https://zeroheight.com/6f840074f/v/latest/p/74200d | À créer |
| 15 | Filter bar | 8630862 | https://zeroheight.com/6f840074f/v/latest/p/15f4db | À créer |
| 16 | Filter control | 9030543 | https://zeroheight.com/6f840074f/v/latest/p/38f1c2 | À créer |
| 17 | Item | 8316977 | https://zeroheight.com/6f840074f/v/latest/p/25059e | À créer |
| 18 | Page Header | 8571394 | https://zeroheight.com/6f840074f/v/latest/p/7407a5 | À créer |
| 19 | Pagination | 8625397 | https://zeroheight.com/6f840074f/v/latest/p/09b616 | À créer |
| 20 | Popover | 8458939 | https://zeroheight.com/6f840074f/v/latest/p/4855a1 | À créer |
| 21 | Query Builder | 9030145 | https://zeroheight.com/6f840074f/v/latest/p/256921 | À créer |
| 22 | Separator | 8474009 | https://zeroheight.com/6f840074f/v/latest/p/668357 | À créer |
| 23 | Screens | 8625116 | https://zeroheight.com/6f840074f/v/latest/p/2991c5 | À créer |
| 24 | Sheet | 8474010 | https://zeroheight.com/6f840074f/v/latest/p/308ca2 | À créer |
| 25 | Skeleton | 8351668 | https://zeroheight.com/6f840074f/v/latest/p/79e66e | À créer |
| 26 | Social share | 8321980 | https://zeroheight.com/6f840074f/v/latest/p/8566b2 | À créer |
| 27 | Sonner | 8316749 | https://zeroheight.com/6f840074f/v/latest/p/66f696 | À créer |
| 28 | Spinner | 8553184 | https://zeroheight.com/6f840074f/v/latest/p/112d85 | À créer |
| 29 | Stepper | 8278505 | https://zeroheight.com/6f840074f/v/latest/p/24ae22 | À créer |
| 30 | Table | 8631439 | https://zeroheight.com/6f840074f/v/latest/p/050c43 | À créer |
| 31 | Tabs | 8320228 | https://zeroheight.com/6f840074f/v/latest/p/27b48e | À créer |
| 32 | Tooltip | 8518797 | https://zeroheight.com/6f840074f/v/latest/p/32d955 | À créer |
| 33 | Timeline | 8779979 | https://zeroheight.com/6f840074f/v/latest/p/18e1fe | À créer |

Hors périmètre (groupe « Tokens & Style ») : Colors, Typography, Layout, Icons & imagery.

## Étape 2 — Première page migrée

`pages/alert.md` : contenu complet de la page Alert, découpé en onglets **Description** et **How to use**, avec les liens Figma de chaque visuel. Les images Zeroheight sont à ré-importer dans Supernova (ou à remplacer par des embeds Figma via les `node-id` indiqués).
