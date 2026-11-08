const express = require("express");
const db = require("../db");

function isValidUrl(value) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function makeCrudRouter(config) {
  const {
    table,
    fields,
    required = [],
    urlFields = [],
    percentFields = [],
    orderBy = "id DESC",
  } = config;

  const router = express.Router();

  function clean(data) {
    const values = {};
    for (const field of fields) {
      let value = data[field];
      if (value === undefined || value === null) value = "";

      if (percentFields.includes(field)) {
        value = Number(value === "" ? 0 : value);
        if (!Number.isInteger(value) || value < 0 || value > 100) {
          return { error: `${field} must be a whole number from 0 to 100` };
        }
      } else {
        value = String(value).trim();
        if (value.length > 2000) {
          return { error: `${field} is too long (max 2000 characters)` };
        }
        if (required.includes(field) && value === "") {
          return { error: `${field} is required` };
        }
      }

      if (urlFields.includes(field)) {
        if (value && !isValidUrl(value)) {
          return { error: `${field} must start with http:// or https://` };
        }
        if (value === "") value = null;
      }

      values[field] = value;
    }
    return { values };
  }

  function getId(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "id must be a positive number" });
      return null;
    }
    return id;
  }

  // READ all
  router.get("/", (req, res) => {
    try {
      res.json(db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all());
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Could not read ${table}` });
    }
  });

  // READ one
  router.get("/:id", (req, res) => {
    try {
      const id = getId(req, res);
      if (id === null) return;
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Could not read ${table}` });
    }
  });

  // CREATE
  router.post("/", (req, res) => {
    try {
      const { error, values } = clean(req.body || {});
      if (error) return res.status(400).json({ error });

      const columns = fields.join(", ");
      const marks = fields.map(() => "?").join(", ");
      const result = db
        .prepare(`INSERT INTO ${table} (${columns}) VALUES (${marks})`)
        .run(...fields.map((f) => values[f]));

      const created = db
        .prepare(`SELECT * FROM ${table} WHERE id = ?`)
        .get(result.lastInsertRowid);
      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Could not create in ${table}` });
    }
  });

  // UPDATE
  router.put("/:id", (req, res) => {
    try {
      const id = getId(req, res);
      if (id === null) return;

      const existing = db
        .prepare(`SELECT * FROM ${table} WHERE id = ?`)
        .get(id);
      if (!existing) return res.status(404).json({ error: "Not found" });

      // new values replace old ones; fields not sent stay the same
      const { error, values } = clean({ ...existing, ...(req.body || {}) });
      if (error) return res.status(400).json({ error });

      const setPart = fields.map((f) => `${f} = ?`).join(", ");
      db.prepare(`UPDATE ${table} SET ${setPart} WHERE id = ?`).run(
        ...fields.map((f) => values[f]),
        id,
      );

      res.json(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Could not update ${table}` });
    }
  });

  // DELETE
  router.delete("/:id", (req, res) => {
    try {
      const id = getId(req, res);
      if (id === null) return;
      const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      if (result.changes === 0)
        return res.status(404).json({ error: "Not found" });
      res.status(204).end();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Could not delete from ${table}` });
    }
  });

  return router;
}

module.exports = makeCrudRouter;
