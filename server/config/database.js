const mongoose = require("mongoose");

async function connectDatabase(uri) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
  } catch (cause) {
    let target = "destino configurado";
    try {
      target = new URL(uri).hostname || target;
    } catch {
      target = String(uri || "")
        .replace(/\/\/[^@]+@/, "//")
        .split("/")[2] || target;
    }

    const error = new Error(
      `Não foi possível conectar ao MongoDB em ${target}. Verifique MONGODB_URI e a disponibilidade do banco.`
    );
    error.cause = cause;
    throw error;
  }
  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
