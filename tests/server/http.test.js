const { z } = require("zod");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

describe("HTTP helpers", () => {
  it("returns the standard success envelope", () => {
    const { sendSuccess } = require("../../server/http/response");
    const response = createResponse();

    sendSuccess(response, {
      status: 201,
      data: { id: "gallery-1" },
      message: "Galeria criada."
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { id: "gallery-1" },
      message: "Galeria criada.",
      error: null
    });
  });

  it("returns the standard error envelope", () => {
    const { sendError } = require("../../server/http/response");
    const response = createResponse();

    sendError(response, {
      status: 401,
      message: "Autenticação obrigatória.",
      error: "AUTH_REQUIRED"
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({
      success: false,
      data: null,
      message: "Autenticação obrigatória.",
      error: "AUTH_REQUIRED"
    });
  });

  it("normalizes validated request data", async () => {
    const { validate } = require("../../server/middleware/validate");
    const request = {
      body: {
        email: "  CLIENTE@EXAMPLE.COM "
      }
    };
    const response = createResponse();
    const next = vi.fn();

    const middleware = validate({
      body: z.object({
        email: z.string().trim().toLowerCase().email()
      })
    });

    await middleware(request, response, next);

    expect(request.body.email).toBe("cliente@example.com");
    expect(next).toHaveBeenCalledWith();
  });

  it("forwards validation errors", async () => {
    const { validate } = require("../../server/middleware/validate");
    const request = { body: { email: "invalid" } };
    const response = createResponse();
    const next = vi.fn();

    const middleware = validate({
      body: z.object({
        email: z.string().email()
      })
    });

    await middleware(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it("maps Zod errors to a validation response", () => {
    const { errorHandler } = require("../../server/middleware/errors");
    const response = createResponse();
    const error = z.object({ email: z.string().email() }).safeParse({
      email: "invalid"
    }).error;

    errorHandler(error, {}, response, vi.fn());

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });
});
