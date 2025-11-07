import express from "express";
import { cancionesEjemplo } from "../data/cancionesEjemplo.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(cancionesEjemplo);
});

router.get("/:id", (req, res) => {
  const cancion = cancionesEjemplo.find(c => c._id === req.params.id);
  if (!cancion) return res.status(404).json({ error: "No encontrada" });
  res.json(cancion);
});

export default router;
