import { Config } from "@remotion/cli/config";
if (process.env.CHROME_PATH) Config.setBrowserExecutable(process.env.CHROME_PATH);
Config.setChromiumOpenGlRenderer("swangle");
