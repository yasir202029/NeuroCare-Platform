import { Router, type IRouter } from "express";
import healthRouter from "./health";
import platformRouter from "./platform";
import ehrRouter from "./ehr";
import consentRouter from "./consent";

const router: IRouter = Router();

router.use(healthRouter);
router.use(platformRouter);
router.use(ehrRouter);
router.use(consentRouter);

export default router;
