import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scheduleRouter from "./schedule";
import stageRouter from "./stage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stageRouter);
router.use(scheduleRouter);

export default router;
