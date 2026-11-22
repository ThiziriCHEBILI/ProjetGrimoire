# Mon Vieux Grimoire : API (back-end)

API du site Mon Vieux Grimoire, avec Node.js, Express et MongoDB (Mongoose).
Le front-end est fourni ici : https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres

## Prérequis

Node.js 20 ou plus récent (testé avec Node.js 24) et npm.

## Installation

```bash
git clone <lien-de-ce-dépôt>
cd <nom-du-dossier>
npm install
```

## Configuration

Copier `.env.example`, le renommer en `.env` (à côté de `package.json`), puis remplir les valeurs :

MONGODB_URI=<chaîne de connexion MongoDB>
JWT_SECRET=<clé secrète>
CORS_ORIGIN=http://localhost:3000

- `MONGODB_URI` : créer une base MongoDB (par exemple un cluster gratuit sur MongoDB Atlas), puis copier sa chaîne de connexion.
- `JWT_SECRET` : une longue clé aléatoire, à générer avec :
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- `CORS_ORIGIN` : l'adresse du front autorisée à appeler l'API.

## Lancement

```bash
npm start
```

L'API tourne sur http://localhost:4000 (message « Connexion à MongoDB réussie ! »).

Pour le front : dans un autre terminal, `npm install` puis `npm start` dans son dossier. Le site s'ouvre sur http://localhost:3000.
