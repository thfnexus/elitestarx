import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import walletRouter from "./wallet";
import adsRouter from "./ads";
import referralsRouter from "./referrals";
import depositsRouter from "./deposits";
import withdrawalsRouter from "./withdrawals";
import rewardsRouter from "./rewards";
import globalPoolRouter from "./globalPool";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(walletRouter);
router.use(adsRouter);
router.use(referralsRouter);
router.use(depositsRouter);
router.use(withdrawalsRouter);
router.use(rewardsRouter);
router.use(globalPoolRouter);
router.use(adminRouter);

export default router;
