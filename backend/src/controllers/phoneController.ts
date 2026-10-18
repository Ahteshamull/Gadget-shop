import { PhoneModel } from "../models/Phone.js";
import { UserModel } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendCreated, sendMessage, sendPaginated, sendSuccess } from "../utils/apiResponse.js";
import { nextPhoneInvoiceNumber } from "../utils/invoice.js";
import { findPaginated, type ListQuery } from "../utils/pagination.js";

export const listPhones = asyncHandler(async (req, res) => {
  const query = req.query as ListQuery;
  const search = query.search?.trim();
  const filter = search
    ? {
        $or: [
          { imei: new RegExp(search, "i") },
          { brand: new RegExp(search, "i") },
          { model: new RegExp(search, "i") },
          { supplierName: new RegExp(search, "i") },
          { supplierPhone: new RegExp(search, "i") },
          { customerName: new RegExp(search, "i") },
          { customerPhone: new RegExp(search, "i") },
          { invoiceNumber: new RegExp(search, "i") },
          { salesPerson: new RegExp(search, "i") },
          { addedBy: new RegExp(search, "i") },
        ],
      }
    : {};
  const result = await findPaginated(PhoneModel, filter, { createdAt: -1 }, query);
  return sendPaginated(res, result.data, result.meta);
});

export const createPhone = asyncHandler(async (req, res) => {
  const payload = req.body;
  const rawImei = String(payload.imei || "").trim();
  if (!rawImei) {
    throw new AppError("IMEI number is required", 400, "VALIDATION_ERROR");
  }

  const exists = await PhoneModel.exists({ imei: rawImei });
  if (exists) {
    const baseImei = rawImei.replace(/\s*\(\d+\)$/, "").trim();
    const escapedBase = baseImei.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingDocs = await PhoneModel.find({
      imei: new RegExp(`^${escapedBase}(\\s*\\(\\d+\\))?$`, "i"),
    })
      .select("imei")
      .lean();

    const existingSet = new Set(
      matchingDocs.map((d) => (d.imei ? d.imei.trim().toLowerCase() : "")),
    );

    let counter = 1;
    while (existingSet.has(`${baseImei.toLowerCase()} (${counter})`)) {
      counter++;
    }
    payload.imei = `${baseImei} (${counter})`;
  } else {
    payload.imei = rawImei;
  }

  payload.supplierName = payload.supplierName || payload.buyerName || "";
  payload.supplierPhone = payload.supplierPhone || payload.buyerPhone || "";
  payload.buyerName = payload.supplierName;
  payload.buyerPhone = payload.supplierPhone;

  if (!payload.addedBy && req.user) {
    const userDoc = await UserModel.findById(req.user.userId).select("name role").lean();
    payload.addedBy = userDoc?.name || (userDoc?.role ? userDoc.role.toUpperCase() : "Admin");
  }
  if (!payload.addedBy) {
    payload.addedBy = "Admin";
  }

  if (!payload.invoiceNumber || payload.invoiceNumber === "INV-TEMP") {
    payload.invoiceNumber = await nextPhoneInvoiceNumber();
  }

  const phone = await PhoneModel.create(payload);
  return sendCreated(res, "Phone stock registered successfully", phone.toJSON());
});

export const updatePhone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  if (patch.imei) {
    const exists = await PhoneModel.exists({ imei: patch.imei, _id: { $ne: id } });
    if (exists) throw new AppError(`Phone with IMEI ${patch.imei} already exists`, 409, "DUPLICATE_IMEI");
  }

  const current = await PhoneModel.findById(id);
  if (!current) throw new AppError("Phone stock record was not found", 404, "PHONE_NOT_FOUND");

  if (patch.supplierName || patch.buyerName) {
    patch.supplierName = patch.supplierName || patch.buyerName || "";
    patch.buyerName = patch.supplierName;
  }
  if (patch.supplierPhone || patch.buyerPhone) {
    patch.supplierPhone = patch.supplierPhone || patch.buyerPhone || "";
    patch.buyerPhone = patch.supplierPhone;
  }

  if (patch.addedBy === undefined || patch.addedBy === "") {
    delete patch.addedBy;
  }

  if (!current.customerName && patch.customerName && (!patch.invoiceNumber || patch.invoiceNumber === "INV-TEMP")) {
    patch.invoiceNumber = await nextPhoneInvoiceNumber();
  }

  const phone = await PhoneModel.findByIdAndUpdate(id, patch, {
    returnDocument: "after",
    runValidators: true,
  });
  return sendSuccess(res, "Phone stock updated successfully", phone?.toJSON());
});

export const deletePhone = asyncHandler(async (req, res) => {
  const deleted = await PhoneModel.findByIdAndDelete(req.params.id);
  if (!deleted) throw new AppError("Phone stock record was not found", 404, "PHONE_NOT_FOUND");
  return sendMessage(res, "Phone stock deleted successfully");
});
