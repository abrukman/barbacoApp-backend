//import { cancionesEjemplo } from "../data/cancionesEjemplo.js";
import { Cancion } from "../models/Cancion.js";

//guardo id con router.param
export async function cancionParam(req, res, next, id) {
  try {
    const cancion = await Cancion.findOne({ id });
    if (!cancion) return res.status(404).json({ error: "Cancion no encontrada" });
    req.cancion = cancion;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor"})
  }
};