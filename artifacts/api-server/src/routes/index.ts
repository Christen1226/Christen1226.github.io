import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scheduleRouter from "./schedule";
import scoringRouter from "./scoring";
import stageRouter from "./stage";
import reportsRouter from "./reports";
import competitionsRouter from "./competitions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stageRouter);
router.use(scheduleRouter);
router.use(scoringRouter);
router.use(reportsRouter);
router.use(competitionsRouter);

export default router;
