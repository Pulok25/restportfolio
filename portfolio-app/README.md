# Portfolio (Express + SQLite + plain HTML/JS)

```
portfolio-app/
├── backend/
│   ├── server.js          starts the server, connects the routes
│   ├── db.js              database file, 5 tables, starter data
│   ├── routes/
│   │   ├── crud.js        reusable GET/POST/PUT/DELETE for a table
│   │   └── bio.js         bio (only one row: GET + PUT)
│   ├── package.json
│   └── .env.example       copy to .env if you want to change PORT
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/app.js          fetch() calls to the REST API
```

## Run

```bash
cd backend
npm install
npm start
```

Open http://localhost:3000. The database file `backend/portfolio.db` is created on the first run.
The backend also serves the `frontend/` folder, so one server = one link.

Click **Edit mode: OFF** in the top bar to turn on Add / Edit / Delete buttons.

## Show it remotely (public link)

Keep the server running, open a second terminal:

```bash
cloudflared tunnel --url http://localhost:3000
```

It prints `https://something.trycloudflare.com`. Open that link from any device.
The link changes every time you restart the tunnel. Your PC must stay on.

There is no login, so **anyone with the link can edit or delete data**. Only share it while demoing, then stop the tunnel (Ctrl+C).

## REST API

| Resource    | Endpoints |
|-------------|-----------|
| projects    | `GET /api/projects`, `GET /api/projects/:id`, `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id` |
| skills      | same 5 routes on `/api/skills` |
| experience  | same 5 routes on `/api/experience` |
| certificates | same 5 routes on `/api/certificates` |
| bio         | `GET /api/bio`, `PUT /api/bio` (one record only) |

Example:

```bash
curl -X POST http://localhost:3000/api/skills \
  -H "Content-Type: application/json" \
  -d '{"name":"Python","category":"Backend","level":90}'
```

Status codes: 200 OK, 201 created, 204 deleted, 400 bad input, 404 not found, 500 server error.
