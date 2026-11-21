// npm run validate -- campaigns/<id>.json
import { campaignPathArg, loadCampaign, printReport } from './lib';

const path = campaignPathArg();
const r = loadCampaign(path);
printReport(r, path);
process.exit(r.errors.length ? 1 : 0);
