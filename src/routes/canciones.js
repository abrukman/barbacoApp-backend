import express from "express";
import { cancionesEjemplo } from "../data/cancionesEjemplo.js";
import { cancionParam } from "../middlewares/cancionParam.js";
import { Cancion } from "../models/Cancion.js";

const router = express.Router();

//lista todas las canciones
router.get("/", (req, res) => {
  try {
    res.json(cancionesEjemplo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor"});
  }
});

//acceder a una cancion particular
//accedo a router.param
router.param("id", cancionParam);

router.get("/:id", (req, res) => {
  try {
    res.json(req.cancion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor"});
  }
});

//acceder a las partituras de una cancion particular
router.get("/:id/partituras", (req, res) => {
  try {
    res.json(req.cancion.partituras);  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor"});
  }
  
})

//acceder a una partitura especifica dentro de una cancion
router.get("/:id/partituras/:pid", (req, res) => {
  try {
    const { pid } = req.params;
    const partitura = req.cancion.partituras.find(p => p.id === pid);
    if (!partitura) return res.status(404).json({ error: "Partitura no encontrada"});
    res.json(partitura);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor"});
  }
  
 });

 //ruta para probar POST en la base de datos
 router.post("/", async (req, res) => {
  if (!req.body.titulo || !req.body.autor) {
    return res.status(400).json({ error: "Faltan datos obligatorios: título o autor" });
  };
  try {
    const nuevaCancion = new Cancion(req.body);
    await nuevaCancion.save();
    res.status(201).json(nuevaCancion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar la canción" });
  }
 });

export default router;
