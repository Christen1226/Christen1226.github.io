import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stageRouter from "./stage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stageRouter);

export default router;
