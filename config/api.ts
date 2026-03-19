import { Platform } from "react-native";

// Detects the correct IP based on your network adapter
// If using an emulator, 10.0.2.2 is standard for localhost access
const LOCAL_IP = "172.20.155.1"; 

export const API_BASE = Platform.select({
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
  // Log the API base URL for debugging
  console.log(`🌐 API_BASE configured: ${url}`);
  console.log(`📱 Platform: ${Platform.OS}`);
}

