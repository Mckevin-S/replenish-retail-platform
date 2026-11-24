# ADR 0001 – Revue automatique des pull requests avec pr-guard

**Statut** : accepté – 24/11/2026

## Contexte

Le projet suit Git Flow : tout passe par une pull request vers `develop`. Certaines règles doivent être vérifiées à chaque PR, sur les seules lignes ajoutées, et le résultat doit être visible dans la PR elle-même.

## Décision

Une action GitHub en TypeScript, `pr-guard`, lit le diff de la PR et publie (ou met à jour) un commentaire unique :

| Règle | Gravité |
|---|---|
| `pr.title` : titre au format Conventional Commits | erreur |
| `secrets.detected` : clé AWS, clé privée, jeton GitHub, mot de passe en clair | erreur |
| `architecture.domain-purity` : pas de Spring ni de JPA dans un paquet `domain` | erreur |
| `sql.no-select-star` : colonnes explicites dans les modèles dbt | erreur |
| `pr.size` : plus de 800 lignes ajoutées | avertissement |
| `tests.missing` : code de production modifié sans test | avertissement |

Une erreur fait échouer la vérification ; un avertissement est seulement signalé.

## Conséquences

- Les règles sont des fonctions pures testées avec Vitest ; `dist/index.js` est construit par esbuild et commité, et la CI vérifie qu'il est à jour.
- Différence avec `code-guard` (projet fundlens) : `pr-guard` ne regarde que les lignes ajoutées de la PR et répond dans la PR.
