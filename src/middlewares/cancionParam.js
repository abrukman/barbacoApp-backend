import { cancionesEjemplo } from "../data/cancionesEjemplo.js";

//guardo id con router.param
export function cancionParam(req, res, next, id) {
  const cancion = cancionesEjemplo.find(c => c.id === id);
  if (!cancion) return res.status(404).json({ error: "Cancion no encontrada" });
  req.cancion = cancion;
  next();
};