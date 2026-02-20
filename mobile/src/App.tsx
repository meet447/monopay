import React from "react";
import { StatusBar } from "expo-status-bar";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { PinProvider, usePin } from "./context/PinContext";
import { ContactProvider } from "./context/ContactContext";
import { LandingScreen } from "./screens/LandingScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { PinEnrollScreen } from "./screens/PinEnrollScreen";
import { PayScreen } from "./screens/PayScreen";
import { TransactionPinScreen } from "./screens/TransactionPinScreen";
import { PaymentSuccessScreen } from "./screens/PaymentSuccessScreen";
import { MerchantTapScreen } from "./screens/MerchantTapScreen";
import { CustomerTapListener } from "./components/CustomerTapListener";

import { API_BASE_URL, DEMO_USER_ID } from "./config";
import { premiumColors } from "./theme/premium";

const Stack = createNativeStackNavigator();
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: premiumColors.bgBottom,
    card: premiumColors.bgBottom,
    border: "transparent",
    text: premiumColors.textPrimary,
    primary: premiumColors.accent,
  },
};

function RootStack() {
  const { publicKey, isLoading: walletLoading } = useWallet() as any;
  const { isEnrolled } = usePin();

  if (walletLoading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        contentStyle: { backgroundColor: premiumColors.bgBottom },
      }}
    >
      {!publicKey ? (
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ animation: "fade" }}
        />
      ) : !isEnrolled ? (
        <Stack.Screen
          name="PinEnroll"
          component={PinEnrollScreen}
          options={{ animation: "fade_from_bottom" }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="MerchantTap"
            component={MerchantTapScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="Pay">
            {(props) => <PayScreen {...props} apiBaseUrl={API_BASE_URL} userId={DEMO_USER_ID} />}
          </Stack.Screen>
          <Stack.Screen
            name="TransactionPin"
            component={TransactionPinScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
            options={{ animation: "fade_from_bottom" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PinProvider>
      <ContactProvider>
        <WalletProvider>
          <NavigationContainer theme={navigationTheme}>
            <CustomerTapListener>
              <StatusBar style="light" />
              <RootStack />
            </CustomerTapListener>
          </NavigationContainer>
        </WalletProvider>
      </ContactProvider>
    </PinProvider>
  );
}
