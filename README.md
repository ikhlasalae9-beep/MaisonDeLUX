# MaisonDeLUX

Prototype PFE d'estimation des prix d'annonces immobilières au Maroc. L'application Next.js conserve son parcours français/arabe et utilise le modèle Python final, sans prix simulé.

## Architecture et fichiers de référence

- Site : `app/`, `components/`, `config/`, `messages/` (Next.js à la racine).
- API : `app/api/estimations/route.ts` relaie vers `backend/app.py` (Flask).
- Dataset final : `data/training/shared/model-ready/maisondelux_model_ready_v1.csv` (13 537 lignes, versionné).
- Notebook exécuté : `ml/notebooks/maisondelux_notebook1.ipynb`.
- Modèle Casablanca actif : `models/casablanca/v1/` (CatBoost), servi par `backend/inference/casablanca.py`. Les artefacts génériques restent requis par les données de localisation, le démarrage backend et les tests.
- Gateway signé : `lib/estimations/gateway.ts`; endpoints Python `/api/ml/*`.
- Collecte/récupération : `ml/scraping/`, `ml/src/pipeline.py`, `ml/src/data_repair/`, `ml/src/scraping_v3/`.

## Installation et lancement

Depuis la racine, avec Python 3.12 et Node.js :

```sh
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m backend.app
```

Dans un second terminal :

```sh
npm ci
npm run dev
```

Ouvrir `http://localhost:3000/fr/estimation` ou `/ar/estimation`. Le navigateur appelle `/api/estimations` ; le serveur Next.js contacte Flask sur `http://127.0.0.1:5000`. Pour un autre hôte, définir `ML_BACKEND_URL` côté serveur. Pour vérifier la version optimisée : `npm run build`, puis `npm run start`.

La route `/api/estimations` applique les règles Phase C et appelle le backend via le gateway signé. Voir [documentation](docs/README.md) pour la configuration auth/sécurité.

## Vérification et documentation

```sh
python -m pytest tests/test_casablanca_inference.py tests/test_casablanca_api.py -q -p no:cacheprovider
python -m pip install -r requirements-scraping.txt
python -m pytest -q -p no:cacheprovider --basetemp=outputs/pytest
npm run build
```

Certains tests historiques des exports nécessitent les données locales de récupération et les références géographiques, qui ne sont pas toutes versionnées. Les tests d'inférence utilisent uniquement le dataset final et le modèle versionnés. Aucun réentraînement n'est nécessaire pour lancer le site.

- [Historique des données](docs/DATA_PIPELINE.md)
- [Collecte et récupération](docs/SCRAPING_AND_RECOVERY.md)
- [Modèle V1 et contrat API](docs/MODEL_V1.md)
- [Documentation actuelle](docs/README.md)

Le prototype est principalement adapté aux appartements à vendre. Les prix sont indicatifs, non des expertises officielles. Les documents historiques sont conservés pour la traçabilité ; MODEL_V1 décrit le modèle générique historique. Le point d’entrée actuel est [docs/README.md](docs/README.md).


## Runtime préparé Casablanca / Marrakech

Python **3.12** est requis par le runtime de production. Installer `requirements.txt` dans un environnement dédié ; utiliser `requirements-dev.txt` pour pytest et les outils de développement. Le runtime utilise `xgboost-cpu==3.4.1` et `scikit-learn==1.9.0`, sans modifier les modèles certifiés.

Après activation de cet environnement, sous PowerShell :

```powershell
$env:MDL_TEST_PYTHON = (python -c "import sys; print(sys.executable)")
python -m pip check
python -m pytest tests/test_city_service.py tests/test_marrakech_inference.py tests/test_casablanca_inference.py tests/test_casablanca_api.py tests/test_marrakech_availability.py tests/test_gateway_security.py -q -W error -p no:cacheprovider
npm run test:security
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

Marrakech reste publiquement désactivée. Les tests internes utilisent le package de production et la migration additive 006 dans une base locale isolée. Les anciens tests nationaux qui attendent une estimation via `/api/estimate` ne décrivent plus le contrat actif : ce service retourne 410.

Le [rapport final Marrakech et sa checklist unique de Preview](docs/MARRAKECH_FINAL_INTEGRATION_REPORT.md) décrit l'intégration, les vérifications et les mesures hébergées encore nécessaires. Aucune migration distante ni aucun déploiement n'a été effectué pendant ce sprint.
