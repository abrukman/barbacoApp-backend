import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cancionesRouter from "./routes/canciones.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🎶");
});
app.use("/api/canciones", cancionesRouter);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
