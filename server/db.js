const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/fotografia", {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
}).then(() => {
  console.log("MongoDB conectado");
}).catch((error) => {
  console.error("Falha ao conectar ao MongoDB:", error.message);
});

module.exports = mongoose;

