import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "react-native-vector-icons"; 
import { MaterialCommunityIcons } from "react-native-vector-icons"; 

import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import BabyScreen from "../screens/BabyScreen";
import InsightsScreen from "../screens/InsightsScreen";
import RidesScreen from "../screens/RidesScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") {
            return <Ionicons name="home" size={size} color={color} />;
          } else if (route.name === "Profile") {
            return <Ionicons name="person" size={size} color={color} />;
          } else if (route.name === "Baby") {
            return <MaterialCommunityIcons name="baby-face-outline" size={size} color={color} />;
          } else if (route.name === "Insights") {
            return <MaterialCommunityIcons name="chart-box" size={size} color={color} />;
          } else if (route.name === "Rides") {
            return <MaterialCommunityIcons name="car" size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: "#007BFF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Rides" component={RidesScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Baby" component={BabyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
