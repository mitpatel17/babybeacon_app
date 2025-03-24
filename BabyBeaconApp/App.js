import React, { useEffect, useState } from "react";
import { AppState, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "./screens/LoginScreen";
import SignupDeviceScreen from "./screens/SignupDeviceScreen";
import SignupUserScreen from "./screens/SignupUserScreen";
import SignupBabyScreen from "./screens/SignupBabyScreen";
import BottomTabNavigator from "./navigation/BottomTabNavigator";

const Stack = createStackNavigator();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkUserLogin = async () => {
      const username = await AsyncStorage.getItem("username");
      setUserToken(username);
      setLoading(false);
    };

    checkUserLogin();
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        await AsyncStorage.removeItem("username");
      }
    };

    const appStateListener = AppState.addEventListener("change", handleAppStateChange);
    return () => appStateListener.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8CC63F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignupDevice" component={SignupDeviceScreen} />
        <Stack.Screen name="SignupUser" component={SignupUserScreen} />
        <Stack.Screen name="SignupBaby" component={SignupBabyScreen} />
        <Stack.Screen name="HomeTabs" component={BottomTabNavigator} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
