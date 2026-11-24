# replenish-retail-platform

> **Statut : en cours de réalisation.** Ce dépôt contient pour l'instant la conception et la feuille de route ; le code arrive lot par lot (voir « Avancement »).

Prévision de la demande et réapprovisionnement des magasins d'une enseigne de bricolage : les ventes remontent en continu, la demande est prévue par magasin et par produit, les chefs de rayon valident les propositions sur mobile et les commandes partent aux fournisseurs par EDI ou par robot, avec un agent IA qui assiste l'approvisionneur.

## Problématique

Une enseigne de 120 magasins subit ruptures et surstocks. Les commandes fournisseurs sont saisies dans une application Jakarta EE vieillissante, parfois retapées sur des portails fournisseurs sans API, sans prévision fiable.

## Fonctionnalités prévues

1. Simulateur de caisses (tickets JSON) → HDFS → Spark Structured Streaming en Scala sur YARN.
2. DAG Airflow nocturne : extraction de l'ERP Oracle, chargement Snowflake, export BigQuery, archive S3.
3. dbt (Snowflake et BigQuery) + Elementary sur les anomalies de stock ; data products Ventes, Stocks, Fournisseurs.
4. Prévision de la demande sur Databricks (LightGBM, MLflow).
5. `replenishment-api` : Spring Boot 3.3, Java 21, hexagonal ; PostgreSQL + MongoDB (catalogue).
6. Legacy Jakarta EE des commandes migré en *strangler fig* vers Spring Boot.
7. `edi-connector` : .NET 8, EDIFACT ORDERS ↔ JSON, pages Razor + Bootstrap + jQuery, IIS, scripts PowerShell de rejeu.
8. Robot UiPath qui saisit les commandes sur un portail fournisseur simulé.
9. PWA React des chefs de rayon via un BFF NestJS ; back-office Angular des acheteurs (montée de version 14 → 18 automatisée).
10. Agent approvisionneur (LangChain + Ollama) avec outils prévision / stock / proposition, et RAG sur les conditions fournisseurs.
11. `pr-guard` : action GitHub qui commente chaque PR (architecture, SQL, secrets).
12. Kubernetes avec autoscaling, Terraform, SLO, alertes, runbook de rejeu des flux.

## Architecture (cible)

```
caisses ─JSON─► HDFS ─► Spark Streaming (Scala) ─┐
ERP Oracle ─► Airflow ─────────────────────────┼─► Snowflake / BigQuery (dbt) ─► prévision Databricks
                                               ▼
     PWA React ─► BFF NestJS ─► replenishment-api (Spring Boot) ◄─ back-office Angular
                                    │            ▲
                    edi-connector (.NET, IIS)    └─ agent approvisionneur (LangChain + Ollama)
                    robot UiPath (portail fournisseur)
```

## Stack

Java 21 · Spring Boot 3.3 · Jakarta EE 10 · Angular 18 · React 18 · NestJS 10 · TypeScript · .NET 8 · Python 3.12 · Scala 2.12 · Spark 3.5 · Hadoop 3.3 · Airflow 2.9 · dbt 1.8 · Elementary · Snowflake · BigQuery · Databricks · LightGBM · MLflow · Oracle 23ai Free · PostgreSQL 16 · MongoDB 7 · Terraform 1.8 · Docker · Kubernetes (kind, Helm) · GitHub Actions · UiPath · PowerShell 7

## Arborescence prévue

```
legacy-orders/  replenishment-api/  edi-connector/  buyer-backoffice/  store-app/  store-bff/
agent/  pr-guard/  pos-simulator/
data/{streaming,airflow,dbt,databricks}/  rpa/uipath/  infra/{compose,helm,terraform}/  docs/
```

## Avancement

| Lot | Contenu | Statut |
|---|---|---|
| L1 | Socle + pr-guard | en cours – pr-guard et CI livrés |
| L2 | Caisses, HDFS, streaming Spark | à faire |
| L3 | Airflow, Snowflake, dbt, Elementary | à faire |
| L4 | Prévision Databricks | à faire |
| L5 | replenishment-api + strangler | à faire |
| L6 | EDI .NET + UiPath | à faire |
| L7 | PWA React, BFF, Angular | à faire |
| L8 | Agent IA, Kubernetes, Terraform, démo | à faire |

## Démarrage rapide (lot 1)

```bash
cd pr-guard
npm ci
npm run typecheck && npm test   # 21 tests Vitest
npm run build                    # dist/index.js utilisé par l'action
```

Voir [ADR 0001](docs/adr/0001-revue-automatique-des-pull-requests.md).

## Méthode

TDD sur le calcul des propositions et la traduction EDI, Conventional Commits, Git Flow, un lot livrable à la fois. Tests unitaires, d'intégration (Testcontainers, MemoryStream, dbt test) et E2E (Playwright) dans la CI.

## Auteur

Mckevin Kamguem Tchuenkam – M2 Architecture et Développement Logiciel, 3iL Ingénieurs.
