import mongoose from "mongoose";

try {
  await mongoose.connect(process.env.URI_MONGO);
  console.log("Connct DB Ok 👏");
} catch (error) {
  console.log("Error de conexión a MongoDB: " + error);
}
