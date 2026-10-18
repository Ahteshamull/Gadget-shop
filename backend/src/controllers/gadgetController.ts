import { GadgetModel } from "../models/Gadget.js";
import { GadgetSaleModel } from "../models/GadgetSale.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendCreated, sendMessage, sendPaginated, sendSuccess } from "../utils/apiResponse.js";
import { nextGadgetInvoiceNumber } from "../utils/invoice.js";
import { findPaginated, type ListQuery } from "../utils/pagination.js";

export const listGadgets = asyncHandler(async (req, res) => {
  const query = req.query as ListQuery;
  const search = query.search?.trim();
  const filter = search
    ? {
        $or: [
          { supplierName: new RegExp(search, "i") },
          { productName: new RegExp(search, "i") },
          { supplierPhone: new RegExp(search, "i") },
          { color: new RegExp(search, "i") },
        ],
      }
    : {};
  const result = await findPaginated(GadgetModel, filter, { createdAt: -1 }, query);
  return sendPaginated(res, result.data, result.meta);
});

export const createGadget = asyncHandler(async (req, res) => {
  const gadget = await GadgetModel.create(req.body);
  return sendCreated(res, "Gadget added to stock successfully", gadget.toJSON());
});

export const updateGadget = asyncHandler(async (req, res) => {
  const gadget = await GadgetModel.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!gadget) throw new AppError("Gadget stock record was not found", 404, "GADGET_NOT_FOUND");
  return sendSuccess(res, "Gadget updated successfully", gadget.toJSON());
});

export const deleteGadget = asyncHandler(async (req, res) => {
  const gadget = await GadgetModel.findByIdAndDelete(req.params.id);
  if (!gadget) throw new AppError("Gadget stock record was not found", 404, "GADGET_NOT_FOUND");
  await GadgetSaleModel.deleteMany({ gadgetId: req.params.id });
  return sendMessage(res, "Gadget deleted successfully");
});

export const listGadgetSales = asyncHandler(async (req, res) => {
  const query = req.query as ListQuery;
  const search = query.search?.trim();
  const filter = search
    ? {
        $or: [
          { productName: new RegExp(search, "i") },
          { customerName: new RegExp(search, "i") },
          { customerPhone: new RegExp(search, "i") },
          { invoiceNumber: new RegExp(search, "i") },
        ],
      }
    : {};
  const result = await findPaginated(GadgetSaleModel, filter, { saleDate: -1 }, query);
  return sendPaginated(
    res,
    result.data.map((sale) => ({ ...sale, gadgetId: String(sale.gadgetId) })),
    result.meta,
  );
});

export const createGadgetSale = asyncHandler(async (req, res) => {
  const payload = req.body;
  const gadget = await GadgetModel.findById(payload.gadgetId).lean();
  if (!gadget) throw new AppError("Selected gadget stock record was not found", 404, "GADGET_NOT_FOUND");

  const sold = await GadgetSaleModel.aggregate<{ total: number }>([
    { $match: { gadgetId: gadget._id } },
    { $group: { _id: "$gadgetId", total: { $sum: "$quantity" } } },
  ]);
  const available = gadget.quantity - (sold[0]?.total ?? 0);
  if (payload.quantity > available) {
    throw new AppError(`Cannot sell ${payload.quantity} unit(s). Only ${available} unit(s) are available`, 409, "GADGET_STOCK_UNAVAILABLE");
  }
  if (payload.sellingPrice < gadget.minSellingPrice) {
    throw new AppError("Selling price is below the minimum selling price", 400, "GADGET_PRICE_BELOW_MINIMUM");
  }

  payload.productName = gadget.productName;
  payload.totalPrice = payload.quantity * payload.sellingPrice;
  payload.invoiceNumber = await nextGadgetInvoiceNumber();

  const sale = await GadgetSaleModel.create(payload);
  return sendCreated(res, "Gadget sale registered successfully", {
    ...sale.toJSON(),
    gadgetId: String(sale.gadgetId),
  });
});
