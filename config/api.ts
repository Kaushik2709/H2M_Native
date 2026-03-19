import { Platform } from "react-native";
import Constants from "expo-constants";

// Preferred: set EXPO_PUBLIC_API_BASE in your env for production builds
const ENV_BASE = process.env.EXPO_PUBLIC_API_BASE?.trim();

const resolveLanIp = () => {
  const uri = Constants.expoConfig?.hostUri || "";
  if (!uri) return null;

  // hostUri looks like "exp://192.168.1.12:19000" — strip scheme/port
  const host = uri.replace(/^(exp:\/\/|http:\/\/|https:\/\/)/, "");
  const ip = host.split(":")[0];
  if (!ip || ip === "localhost") return Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return ip;
};

// Fallback IP if hostUri is unavailable (update to your machine's LAN IP)
const FALLBACK_LAN_IP = "10.44.106.1";
const LOCAL_IP = resolveLanIp() || FALLBACK_LAN_IP;

export const API_BASE = ENV_BASE
  || Platform.select({
    web: "http://localhost:3001",
    android: `http://${LOCAL_IP}:3001`,
    ios: `http://${LOCAL_IP}:3001`,
  });

// Helpful dev-time check: warn if the URL looks malformed
if (__DEV__) {
  const url = API_BASE as string;
  if (url.includes(" ")) {
    // eslint-disable-next-line no-console
    console.warn(
      "API_BASE contains whitespace — check LOCAL_IP in config/api.ts"
    );
  }
  if (!ENV_BASE && LOCAL_IP === FALLBACK_LAN_IP) {
    console.log("⚠️  Using fallback LAN IP. Set EXPO_PUBLIC_API_BASE or update LOCAL_IP for production.");
  }
  // Log the API base URL for debugging
  console.log(`🌐 API_BASE configured: ${url}`);
  console.log(`📱 Platform: ${Platform.OS}`);
}

