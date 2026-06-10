function sendSuccess(
  res,
  {
    status = 200,
    data = null,
    message = "OK"
  } = {}
) {
  return res.status(status).json({
    success: true,
    data,
    message,
    error: null
  });
}

function sendError(
  res,
  {
    status = 500,
    message = "Erro interno.",
    error = "INTERNAL_ERROR"
  } = {}
) {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    error
  });
}

module.exports = {
  sendError,
  sendSuccess
};
