import { Router } from "express";
import {
  createManagedUser,
  deleteManagedUser,
  listManagedUsers,
  updateManagedUserRole,
  updateManagedUserStatus,
} from "../controllers/adminUserController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createManagedUserSchema,
  updateManagedUserRoleSchema,
  updateManagedUserStatusSchema,
  userIdParamSchema,
} from "../schemas/authSchemas.js";

export const adminUserRoutes = Router();

adminUserRoutes.use(requireAuth, requireAdmin);
adminUserRoutes.get("/", listManagedUsers);
adminUserRoutes.post("/create-user", validate(createManagedUserSchema), createManagedUser);
adminUserRoutes.patch("/update-role/:id", validate(updateManagedUserRoleSchema), updateManagedUserRole);
adminUserRoutes.patch("/update-status/:id", validate(updateManagedUserStatusSchema), updateManagedUserStatus);
adminUserRoutes.delete("/:id", validate(userIdParamSchema), deleteManagedUser);
adminUserRoutes.delete("/delete-user/:id", validate(userIdParamSchema), deleteManagedUser);

