import { Platform } from "react-native";

// Use your machine's local IP for physical device testing
const DEV_HOST = "192.168.0.4";

// Override with your machine's local IP when testing on a physical device
export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:8090`
  : "https://api.monopay.app"; // TODO: set production URL

export const DEMO_USER_ID = "usr_demo";
export const VPA_DOMAIN = "@monopay.app";
