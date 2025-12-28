import { Stack } from "expo-router";
import "@/global.css";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return(
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="(drawer)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="components/Auctionroom" 
          options={{
            headerShown:false
          }}
        />
        <Stack.Screen name="components/CarDetails" 
          options={{
            title: 'Car Details',
          }}
        />
        <Stack.Screen name="components/BikeDetails" 
          options={{
            title: 'Bike Details',
          }}
        />
        <Stack.Screen 
          name="auth/callback" 
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </AuthProvider>
  )
}
