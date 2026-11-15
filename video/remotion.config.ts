import { Config } from "@remotion/cli/config";
import { webpackOverride } from "./scripts/webpack-override.mjs";

Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(14);
Config.setConcurrency(6);
Config.overrideWebpackConfig(webpackOverride);
