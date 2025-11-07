export const cancionesEjemplo = [
  {
    id: "temaA",
    nombre: "Tema A",
    portada: "https://placehold.co/200x200?text=Portada+A",
    descripcion: "descripcion del tema a",
    partituras: [
      { id: "guitarra",
        instrumento:"Guitarra", 
        url: "https://example.com/partitura/guitarraA.svg",
        orden: 1
       },
      { id: "bajo",
        instrumento: "Bajo", 
        url: "https://example.com/partitura/bajoA.svg",
        orden: 2
      },
    ]
  },
  {
    id: "temaB",
    nombre: "Tema B",
    portada: "https://placehold.co/200x200?text=Portada+B",
    descripcion: "descripcion del tema b",
    partituras: [
      { id: "piano",
        instrumento: "Piano", 
        url: "https://example.com/partitura/pianoB.pdf",
        orden: 2
      }
    ]
  }
];
