import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { isValidObjectId, Types } from "mongoose";
import { AccessRequestModel } from "../models/AccessRequest.js";
import { UserModel } from "../models/User.js";
import { sendAccessRequestDecisionNotice } from "../services/emailService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";

type AccessRequestStatus = "pending" | "approved" | "rejected";
type UserRole = "admin" | "staff";

function createTemporaryPassword(): string {
  return `Pt-${randomBytes(5).toString("base64url")}-${randomBytes(3).toString("hex")}`;
}

function serializeRequest(request: {
  _id: unknown;
  name: string;
  email: string;
  message?: string;
  requestedRole?: string;
  status: string;
  decidedBy?: unknown;
  decidedAt?: Date | null;
  decisionNote?: string;
  createdUserId?: unknown;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}) {
  return {
    id: String(request._id),
    name: request.name,
    email: request.email,
    message: request.message ?? "",
    requestedRole: (request.requestedRole ?? "admin") as UserRole,
    status: request.status as AccessRequestStatus,
    decidedBy: request.decidedBy ? String(request.decidedBy) : null,
    decidedAt: request.decidedAt ? request.decidedAt.toISOString() : null,
    decisionNote: request.decisionNote ?? "",
    createdUserId: request.createdUserId ? String(request.createdUserId) : null,
    createdAt: request.createdAt ? request.createdAt.toISOString() : "",
    updatedAt: request.updatedAt ? request.updatedAt.toISOString() : "",
  };
}

export const listAccessRequests = asyncHandler(async (_req, res) => {
  const requests = await AccessRequestModel.find()
    .sort({ createdAt: -1 })
    .select("name email message requestedRole status decidedBy decidedAt decisionNote createdUserId createdAt updatedAt")
    .lean();

  return sendSuccess(res, "Access requests loaded successfully.", requests.map(serializeRequest));
});

export const decideAccessRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, role, note } = req.body as { action: "approve" | "reject"; role: UserRole; note: string };

  if (!id || !isValidObjectId(id)) {
    throw new AppError("Access request id is invalid", 400, "ACCESS_REQUEST_ID_INVALID");
  }
  if (!req.user?.userId) {
    throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
  }

  const request = await AccessRequestModel.findById(id);
  if (!request) {
    throw new AppError("Access request was not found", 404, "ACCESS_REQUEST_NOT_FOUND");
  }
  if (request.status !== "pending") {
    throw new AppError("This access request has already been reviewed", 409, "ACCESS_REQUEST_ALREADY_REVIEWED");
  }

  request.decidedBy = new Types.ObjectId(req.user.userId);
  request.decidedAt = new Date();
  request.decisionNote = note;

  if (action === "reject") {
    request.status = "rejected";
    await request.save();
    await sendAccessRequestDecisionNotice({
      name: request.name,
      email: request.email,
      status: "rejected",
      role,
      note,
    });
    return sendSuccess(res, "Access request rejected successfully.", serializeRequest(request.toObject()));
  }

  const temporaryPassword = createTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await UserModel.findOneAndUpdate(
    { email: request.email },
    {
      $set: {
        email: request.email,
        name: request.name,
        passwordHash,
        role,
        accessStatus: "active",
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
  );

  if (!user) {
    throw new AppError("Approved user account could not be created", 500, "APPROVED_USER_CREATE_FAILED");
  }

  request.status = "approved";
  request.requestedRole = role;
  request.createdUserId = user._id;
  await request.save();
  await sendAccessRequestDecisionNotice({
    name: request.name,
    email: request.email,
    status: "approved",
    role,
    temporaryPassword,
    note,
  });

  return sendSuccess(res, "Access request approved and user account updated successfully.", serializeRequest(request.toObject()));
});
