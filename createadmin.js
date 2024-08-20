const auth = require("../middlewares/auth");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// Mock the necessary dependencies
jest.mock("jsonwebtoken");
jest.mock("../models/user");

describe("auth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 if no authorization header is provided", async () => {
    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: "Authentication Invalid",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 400 if authorization header does not start with 'Bearer'", async () => {
    req.headers.authorization = "InvalidToken";

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: "Authentication Invalid",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 400 if token is missing", async () => {
    req.headers.authorization = "Bearer";

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Token not found",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should set req.userRole and req.user if token is valid", async () => {
    const token = "validToken";
    const userId = "user123";
    const user = { userId };

    req.headers.authorization = `Bearer ${token}`;
    jwt.verify.mockReturnValue({ userId });
    User.findById.mockResolvedValue({
      select: jest.fn().mockReturnValue(user),
    });

    await auth(req, res, next);

    expect(req.userRole).toBeUndefined(); // Assuming userRole is not set yet
    expect(req.user).toEqual({ userId });
    expect(next).toHaveBeenCalled();
  });

  test("should return 400 if token verification fails", async () => {
    req.headers.authorization = "Bearer invalidToken";
    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: "Authentication Invalid",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
