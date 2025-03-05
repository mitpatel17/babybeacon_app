import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import API_BASE_URL from "../config"; // Import API URL
import AsyncStorage from "@react-native-async-storage/async-storage";


const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      if (response.data.status === "success") {
        await AsyncStorage.setItem("username", username);
        navigation.replace("HomeTabs"); // ✅ Ensure `HomeTabs` is registered in `App.js`
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
      <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("SignupDevice")} style={styles.signupButton}>
        <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 30, fontWeight: "bold", marginBottom: 10, color: "#007BFF" },
  subtitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "80%", height: 40, borderColor: "#ccc", borderWidth: 1, marginBottom: 10, padding: 8, borderRadius: 5, backgroundColor: "#fff" },
  button: { backgroundColor: "#007BFF", padding: 10, borderRadius: 5, width: "80%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  signupButton: { marginTop: 10 },
  signupText: { color: "#007BFF", fontSize: 14 },
});

export default LoginScreen;
