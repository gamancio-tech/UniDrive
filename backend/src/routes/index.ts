import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { dailyStatusRoutes } from "./dailyStatus.routes";
import { tripCancellationRoutes } from "./tripCancellation.routes";
import { announcementRoutes } from "./announcement.routes";
import { studentRoutes } from "./student.routes";
import { paymentRoutes } from "./payment.routes";
import { pushRoutes } from "./push.routes";
import { adminRoutes } from "./admin.routes";
import { chatRoutes } from "./chat.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/daily-status", dailyStatusRoutes);
routes.use("/trip-cancellations", tripCancellationRoutes);
routes.use("/announcements", announcementRoutes);
routes.use("/admin", adminRoutes);
routes.use("/students", studentRoutes);
routes.use("/payments", paymentRoutes);
routes.use("/push", pushRoutes);
routes.use("/chat", chatRoutes);

