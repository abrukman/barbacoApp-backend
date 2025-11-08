import mongoose from "mongoose";
import slugify from "slugify";

const PartituraSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  instrumento: { type: String, required: [true, "Debe incluir un instrumento"] },
  archivo: { type: String, required: [true, "Debe incluir al menos un archivo"] },
});

const CancionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titulo: { type: String, required: [true, "El titulo es obligatorio"] },
  autor: { type: String, required: [true, "El autor es obligatorio"] },
  letra: { type: String, required: [true, "La letra es obligatoria"] },
  portada: { type: String },
  descripcion: { type: String },
  analisisIA: { type: String },
  partituras: {
    type: [PartituraSchema],
    validate: {
      validator: function (arr) {
        return arr.length > 0;
      },
      message: "Debe haber al menos una partitura",
    },
  },
});

// Genera id automáticamente
CancionSchema.pre("validate", function (next) {
  if (!this.id) {
    this.id = slugify(this.titulo, { lower: true, strict: true });
  };

    //de las partituras
  this.partituras = this.partituras.map((p) => {
    if (!p.id) {
      p.id = slugify(`${this.titulo}-${p.instrumento}`, {
        lower: true,
        strict: true,
      });
    }
    return p;
  });

  next();
});


export const Cancion = mongoose.model("Cancion", CancionSchema, "canciones");
