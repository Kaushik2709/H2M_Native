import { Platform } from "react-native";

const LOCAL_IP = "10.88.56.202"; // ensure no leading/trailing spaces

export const API_BASE = Platform.select({
  web: "http://localhost:3001",
  android: __DEV__
    ? `http://${LOCAL_IP}:3001` // physical device in dev
    : `http://${LOCAL_IP}:3001`, // production build
  ios: __DEV__
    ? `http://${LOCAL_IP}:3001` // physical device in dev
    : `http://${LOCAL_IP}:3001`, // production build
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

