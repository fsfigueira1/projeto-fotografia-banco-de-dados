const { ZodError } = require("zod");
const { sendError } = require("../http/response");

function notFoundHandler(_req, res) {
  return sendError(res, {
    status: 404,
    message: "Rota não encontrada.",
    error: "ROUTE_NOT_FOUND"
  });
}

function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return sendError(res, {
      status: 400,
      message: error.issues.map((issue) => issue.message).join(" "),
      error: "VALIDATION_ERROR"
    });
  }

  if (error?.code === 11000) {
    return sendError(res, {
      status: 409,
      message: "Já existe um registro com estes dados.",
      error: "RESOURCE_CONFLICT"
    });
  }

  if (error?.name === "CastError") {
    return sendError(res, {
      status: 400,
      message: "Identificador inválido.",
      error: "INVALID_IDENTIFIER"
    });
  }

  if (process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  const status = Number(error?.status) || 500;
  const safeToExpose =
    status < 500 ||
    error?.expose === true;

  return sendError(res, {
    status,
    message: safeToExpose && error?.message
      ? error.message
      : "Não foi possível concluir a solicitação.",
    error: error?.code || "INTERNAL_ERROR"
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
