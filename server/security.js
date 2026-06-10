const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-fauzi-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const GALLERY_SESSION_EXPIRES_IN = process.env.GALLERY_SESSION_EXPIRES_IN || "8h";

function signUserToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      nome: user.nome,
      role: user.role || "client",
      kind: "user"
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signGalleryToken(payload) {
  return jwt.sign(
    {
      ...payload,
      kind: "gallery"
    },
    JWT_SECRET,
    { expiresIn: GALLERY_SESSION_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function extractBearer(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearer(req) || req.headers["x-auth-token"] || req.query.token || null;
    if (!token) {
      return res.status(401).json({ error: "Autenticação obrigatória." });
    }

    const payload = verifyToken(String(token));
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({ error: "Autenticação obrigatória." });
  }

  if (req.auth.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito ao administrador." });
  }

  return next();
}

function requireGallerySession(req, res, next) {
  try {
    const token = req.headers["x-gallery-token"] || req.query.access || req.query.token || null;
    if (!token) {
      return res.status(401).json({ error: "Senha da galeria obrigatória." });
    }

    const payload = verifyToken(String(token));
    if (payload.kind !== "gallery") {
      return res.status(401).json({ error: "Sessão de galeria inválida." });
    }

    req.gallerySession = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Sessão da galeria expirada." });
  }
}

module.exports = {
  signUserToken,
  signGalleryToken,
  verifyToken,
  requireAuth,
  requireAdmin,
  requireGallerySession
};
