import { Router, type IRouter } from "express";
import healthRouter from "./health";
import platformRouter from "./platform";
import ehrRouter from "./ehr";
import consentRouter from "./consent";
import accessRouter from "./access";
import recordsRouter from "./records";
import questionnairesRouter from "./questionnaires";
import brandingRouter from "./branding";

const router: IRouter = Router();

router.use(healthRouter);
router.use(platformRouter);
router.use(ehrRouter);
router.use(consentRouter);
router.use(accessRouter);
router.use(recordsRouter);
router.use(questionnairesRouter);
router.use(brandingRouter);

export default router;
