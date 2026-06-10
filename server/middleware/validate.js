function validate(schemas) {
  return async function validationMiddleware(req, _res, next) {
    try {
      for (const section of ["body", "params", "query"]) {
        if (!schemas[section]) continue;
        req[section] = await schemas[section].parseAsync(req[section] || {});
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  validate
};
