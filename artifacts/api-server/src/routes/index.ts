import { Router, type IRouter } from "express";
import healthRouter from "./health";
import platformRouter from "./platform";
import ehrRouter from "./ehr";
import consentRouter from "./consent";
import accessRouter from "./access";
import recordsRouter from "./records";

const router: IRouter = Router();

router.use(healthRouter);
router.use(platformRouter);
router.use(ehrRouter);
router.use(consentRouter);
router.use(accessRouter);
router.use(recordsRouter);

export default router;
