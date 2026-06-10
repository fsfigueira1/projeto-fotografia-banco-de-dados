const mongoose = require("../server/db");
const bcrypt = require("bcrypt");

const Gallery = require("../models/Gallery");
const AccessCode = require("../models/AccessCode");
const Foto = require("../models/Foto");

const SEED_USER_ID = "fauzi-eventos-seed";
const SEED_GALLERY_SLUG = "fauzi-eventos-premium";
const SEED_CODE = "TESTE1";

const fotos = [
  {
    sourceUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    userId: SEED_USER_ID,
    preco: 65,
    evento: "Casamento Fauzi Eventos",
    cidade: "Cerimônia e recepção",
    destaque: true,
    requiresAccess: true
  },
  {
    sourceUrl: "https://images.unsplash.com/photo-1523438097201-512ae7d59c42?auto=format&fit=crop&w=1600&q=80",
    userId: SEED_USER_ID,
    preco: 55,
    evento: "Aniversário Fauzi Eventos",
    cidade: "Festa de celebração",
    destaque: true,
    requiresAccess: true
  },
  {
    sourceUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80",
    userId: SEED_USER_ID,
    preco: 60,
    evento: "Formatura Fauzi Eventos",
    cidade: "Colação e baile",
    destaque: true,
    requiresAccess: true
  },
  {
    sourceUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    userId: SEED_USER_ID,
    preco: 45,
    evento: "Evento corporativo Fauzi Eventos",
    cidade: "Networking e recepção",
    destaque: false,
    requiresAccess: true
  }
];

async function seed() {
  try {
    await mongoose.connection.asPromise();

    const existingGallery = await Gallery.findOne({ slug: SEED_GALLERY_SLUG });
    if (existingGallery) {
      console.log(`[seed] Skipped. Gallery already exists: ${SEED_GALLERY_SLUG}`);
      return;
    }

    const gallery = await Gallery.create({
      title: "Fauzi Eventos Premium",
      slug: SEED_GALLERY_SLUG,
      eventType: "Evento privado",
      description: "Galeria de demonstração com acesso por senha",
      customerName: "Cliente Demo",
      customerEmail: "cliente@demo.local",
      status: "active",
      createdBy: SEED_USER_ID
    });

    const inserted = await Foto.insertMany(
      fotos.map((photo) => ({
        ...photo,
        galleryId: String(gallery._id),
        url: photo.sourceUrl
      })),
      { ordered: true }
    );

    gallery.photoIds = inserted.map((photo) => String(photo._id));
    gallery.coverPhotoId = String(inserted[0]._id);
    await gallery.save();

    const codeHash = await bcrypt.hash(SEED_CODE, 10);
    await AccessCode.create({
      galleryId: String(gallery._id),
      label: "Código demo",
      codeHash,
      active: true,
      customerName: "Cliente Demo",
      customerEmail: "cliente@demo.local",
      createdBy: SEED_USER_ID
    });

    console.log(`[seed] Gallery created with access code ${SEED_CODE}`);
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
}

seed().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exitCode = 1;
});
