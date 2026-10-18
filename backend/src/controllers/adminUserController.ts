import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { UserModel } from "../models/User.js";
import { AccessRequestModel } from "../models/AccessRequest.js";
import { PartnerTransactionModel } from "../models/PartnerTransaction.js";
import { BusinessProfileModel } from "../models/BusinessProfile.js";
import { PhoneModel } from "../models/Phone.js";
import { GadgetSaleModel } from "../models/GadgetSale.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendCreated, sendMessage, sendSuccess } from "../utils/apiResponse.js";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type ManagedUser = {
  _id: unknown;
  name: string;
  email: string;
  role: "owner" | "admin" | "partner" | "staff";
  accessStatus?: "active" | "disabled";
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

function serializeUser(user: ManagedUser) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    accessStatus: user.accessStatus ?? "active",
    createdAt: user.createdAt ? user.createdAt.toISOString() : "",
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : "",
  };
}

export const listManagedUsers = asyncHandler(async (_req, res) => {
  const users = await UserModel.find()
    .sort({ createdAt: -1 })
    .select("name email role accessStatus createdAt updatedAt")
    .lean<ManagedUser[]>();

  return sendSuccess(res, "Managed users loaded successfully.", users.map(serializeUser));
});

export const createManagedUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: "owner" | "admin" | "partner" | "staff";
  };

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await UserModel.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409, "USER_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await UserModel.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
    accessStatus: "active",
  });

  return sendCreated(
    res,
    `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
    serializeUser(newUser.toObject()),
  );
});

export const updateManagedUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role: "owner" | "admin" | "partner" | "staff" };

  if (!id || !isValidObjectId(id)) {
    throw new AppError("User id is invalid", 400, "USER_ID_INVALID");
  }

  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError("User account was not found", 404, "USER_NOT_FOUND");
  }

  if (id === req.user?.userId && user.role === "owner" && role !== "owner") {
    throw new AppError("You cannot downgrade your own Owner role", 409, "SELF_ROLE_DOWNGRADE_BLOCKED");
  }

  user.role = role;
  await user.save();

  return sendSuccess(res, `User role updated to ${role} successfully.`, serializeUser(user.toObject()));
});

export const updateManagedUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accessStatus } = req.body as { accessStatus: "active" | "disabled" };

  if (!id || !isValidObjectId(id)) {
    throw new AppError("User id is invalid", 400, "USER_ID_INVALID");
  }

  if (id === req.user?.userId) {
    throw new AppError("You cannot disable your own account", 409, "SELF_DISABLE_BLOCKED");
  }

  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError("User account was not found", 404, "USER_NOT_FOUND");
  }

  user.accessStatus = accessStatus;
  await user.save();

  return sendSuccess(
    res,
    `Account status updated to ${accessStatus} successfully.`,
    serializeUser(user.toObject()),
  );
});

export const deleteManagedUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new AppError("User id is invalid", 400, "USER_ID_INVALID");
  }
  if (!req.user?.userId) {
    throw new AppError("Admin user context is missing from the access token", 401, "AUTH_CONTEXT_MISSING");
  }
  if (id === req.user.userId) {
    throw new AppError("You cannot delete your own account", 409, "SELF_DELETE_BLOCKED");
  }

  const user = await UserModel.findById(id).select("role email name");
  if (!user) {
    throw new AppError("User account was not found", 404, "USER_NOT_FOUND");
  }

  if (user.role === "owner" && req.user.role !== "owner" && req.user.role !== "admin") {
    throw new AppError("Only an Owner or Admin can delete another owner account", 403, "OWNER_DELETE_BLOCKED");
  }

  const trimmedName = user.name.trim();
  const trimmedEmail = user.email.trim();
  const escapedName = escapeRegExp(trimmedName);
  const escapedEmail = escapeRegExp(trimmedEmail);

  const nameRegex = new RegExp(`^\\s*${escapedName}\\s*$`, "i");
  const emailRegex = new RegExp(`^\\s*${escapedEmail}\\s*$`, "i");

  // 1. Cascade delete all access requests tied to this user ID, email, or name
  await AccessRequestModel.deleteMany({
    $or: [
      { createdUserId: id },
      { email: emailRegex },
      { name: nameRegex },
    ],
  });

  // 2. Cascade delete ALL ledger transactions (Investments & Withdrawals) tied to this user/partner
  await PartnerTransactionModel.deleteMany({
    $or: [
      { partner: nameRegex },
      { partner: emailRegex },
    ],
  });

  // 3. Remove user from BusinessProfile owners and rebalance equity cleanly
  const profile = await BusinessProfileModel.findOne({ key: "default" });
  if (profile) {
    let updatedOwners = profile.owners
      .map((owner) => ({ name: owner.name, role: owner.role, share: owner.share }))
      .filter(
        (owner) =>
          !nameRegex.test(owner.name.trim()) && !emailRegex.test(owner.name.trim()),
      );

    // If no owners left in business profile, assign the first remaining active owner/admin
    if (updatedOwners.length === 0) {
      const remainingMaster = await UserModel.findOne({
        _id: { $ne: id },
        role: { $in: ["owner", "admin"] },
        accessStatus: "active",
      }).sort({ createdAt: 1 });

      if (remainingMaster) {
        updatedOwners = [{ name: remainingMaster.name, role: "Owner" as const, share: 100 }];
      }
    } else {
      // Re-normalize equity shares so the sum remains strictly 100%
      const currentTotalShare = updatedOwners.reduce((sum, o) => sum + (o.share || 0), 0);
      if (currentTotalShare > 0 && Math.abs(currentTotalShare - 100) > 0.01) {
        const factor = 100 / currentTotalShare;
        updatedOwners = updatedOwners.map((o) => ({
          ...o,
          share: Number((o.share * factor).toFixed(2)),
        }));
      }
    }

    const updates: Record<string, unknown> = { owners: updatedOwners };
    if (profile.configuredBy && String(profile.configuredBy) === id) {
      updates.configuredBy = null;
    }

    await BusinessProfileModel.updateOne({ key: "default" }, { $set: updates });
  }

  // 4. Clean up Phone inventory records and transfer history
  // Reset salesPerson so the deleted user's name is completely cleared from memos/invoices
  await PhoneModel.updateMany(
    { $or: [{ salesPerson: nameRegex }, { salesPerson: emailRegex }] },
    { $set: { salesPerson: "" } },
  );

  // Remove ownership transfer records matching this user
  await PhoneModel.updateMany(
    {},
    {
      $pull: {
        ownership: {
          $or: [{ owner: nameRegex }, { owner: emailRegex }],
        },
      },
    },
  );

  // 5. Clean up Gadget sales invoices
  await GadgetSaleModel.updateMany(
    { $or: [{ salesPerson: nameRegex }, { salesPerson: emailRegex }] },
    { $set: { salesPerson: "" } },
  );

  // 6. Delete the user account itself
  await UserModel.deleteOne({ _id: id });
  return sendMessage(res, `Account ${user.email} and all associated records, transactions, and withdrawals deleted successfully.`);
});


