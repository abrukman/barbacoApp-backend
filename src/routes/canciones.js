import express from "express";
//import { cancionesEjemplo } from "../data/cancionesEjemplo.js";
import { cancionParam } from "../middlewares/cancionParam.js";
import { Cancion } from "../models/Cancion.js";
import slugify from "slugify";

const router = express.Router();

//lista todas las canciones
router.get("/", async (req, res) => {
  try {
    const canciones = await Cancion.find();
    res.json(canciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor"});
  }
});


//accedo a router.param
router.param("id", cancionParam);

//acceder a una cancion particular
router.get("/:id", async (req, res) => {
    res.json(req.cancion);
});

//acceder a las partituras de una cancion particular
router.get("/:id/partituras", (req, res) => {
    res.json(req.cancion.partituras);  
});

//acceder a una partitura especifica dentro de una cancion
router.get("/:id/partituras/:pid", (req, res) => {
    const partitura = req.cancion.partituras.find(p => p.id === req.params.pid);
    if (!partitura) return res.status(404).json({ error: "Partitura no encontrada"});
    res.json(partitura);  
 });

 //POST
 router.post("/", async (req, res) => {
  const { titulo, autor, letra, portada, partituras } = req.body;

  //validaciones
  if (!titulo || !autor || !letra) {
    return res
      .status(400)
      .json({ error: "Faltan datos obligatorios: título, autor o letra" });
    };

  if(!Array.isArray(partituras) || partituras.lenght === 0) {
    return res
      .status(400)
      .json({ error: "Debe incluir al menos una partitura"});
    };

  try {
    const nuevaCancion = new Cancion(req.body);
    await nuevaCancion.save();
    res.status(201).json(nuevaCancion);
    } catch (error) {
      if(error.name === "ValidationError") {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes });
    }
    console.error(error);
    res.status(500).json({ error: "Error al guardar la canción" });
    };
 });

 //PATCH(editar parcialmente, no se puede modificar titulo ni autor, solo letra, descripcion, portada y partituras)
 router.patch("/:id", async (req, res) => {
  try {
    const cancion = await Cancion.findOne(
      { id: req.params.id });
    if(!cancion) {
      return res
        .status(404)
        .json({ error: "Cancion no encontrada" })
    };

    const camposPermitidos = ["descripcion", "letra", "portada", "partituras"];
    for (const campo of camposPermitidos) {
      if(req.body[campo] !== undefined) {
        cancion[campo] = req.body[campo];
      };
    };

    await cancion.save();
    res.json(cancion);
    
  } catch (error) {
    if(error.name === "ValidationError") {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: mensajes });
    }
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la cancion" });
  };
 });

 //DELETE
 router.delete("/:id", async (req, res) => {
  try {
    const cancionEliminada = await Cancion.findOneAndDelete(
      { id: req.params.id });
    if(!cancionEliminada) {
      return res
        .status(404)
        .json({ error: "Cancion no encontrada "});
    };
    res.json({ mensaje: "Cancion eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la cancion "});
  };
 });


export default router;
