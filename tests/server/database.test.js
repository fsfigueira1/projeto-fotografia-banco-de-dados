const mongoose = require("mongoose");

describe("database connection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("connects with bounded timeouts", async () => {
    const connect = vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);
    const { connectDatabase } = require("../../server/config/database");

    await connectDatabase("mongodb://127.0.0.1:27017/test");

    expect(connect).toHaveBeenCalledWith(
      "mongodb://127.0.0.1:27017/test",
      expect.objectContaining({
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      })
    );
  });

  it("disconnects through mongoose", async () => {
    const disconnect = vi.spyOn(mongoose, "disconnect").mockResolvedValue();
    const { disconnectDatabase } = require("../../server/config/database");

    await disconnectDatabase();

    expect(disconnect).toHaveBeenCalledOnce();
  });
});
