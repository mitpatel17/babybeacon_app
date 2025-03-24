import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import API_BASE_URL from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, FONTS, SPACING, SHARED_STYLES } from "../styles/theme";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      if (response.data.status === "success") {
        await AsyncStorage.setItem("username", username);
        navigation.replace("HomeTabs");
      } else {
        Alert.alert("Login Failed", response.data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BabyBeacon</Text>
      <Text style={styles.subtitle}>Login</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("SignupDevice")} style={styles.signupButton}>
        <Text style={styles.signupText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: COLORS.background,
    padding: SPACING.xl 
  },
  title: { 
    fontSize: FONTS.sizes.xxxlarge, 
    fontWeight: FONTS.weights.bold, 
    marginBottom: SPACING.s, 
    color: COLORS.primary
  },
  subtitle: { 
    fontSize: FONTS.sizes.large, 
    marginBottom: SPACING.xl,
    color: COLORS.black
  },
  input: {
    ...SHARED_STYLES.input
  },
  primaryButton: {
    ...SHARED_STYLES.primaryButton
  },
  buttonText: { 
    ...SHARED_STYLES.buttonText
  },
  signupButton: { 
    marginTop: SPACING.l
  },
  signupText: { 
    color: COLORS.secondary, 
    fontSize: FONTS.sizes.small
  },
});

export default LoginScreen;
