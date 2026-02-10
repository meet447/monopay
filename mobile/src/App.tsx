import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
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

import { API_BASE_URL, DEMO_USER_ID } from "./config";

const Stack = createNativeStackNavigator();

function RootStack() {
  const { publicKey, isLoading: walletLoading } = useWallet() as any;
  const { isEnrolled } = usePin();

  if (walletLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!publicKey ? (
        <Stack.Screen name="Landing" component={LandingScreen} />
      ) : !isEnrolled ? (
        <Stack.Screen name="PinEnroll" component={PinEnrollScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Pay">
            {(props) => <PayScreen {...props} apiBaseUrl={API_BASE_URL} userId={DEMO_USER_ID} />}
          </Stack.Screen>
          <Stack.Screen name="TransactionPin" component={TransactionPinScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
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
          <NavigationContainer>
            <StatusBar style="light" />
            <RootStack />
          </NavigationContainer>
        </WalletProvider>
      </ContactProvider>
    </PinProvider>
  );
}
