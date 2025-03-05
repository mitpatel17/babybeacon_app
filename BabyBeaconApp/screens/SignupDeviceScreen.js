import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

const SignupDeviceScreen = ({ navigation }) => {
  const [device_id, setDeviceId] = useState("");

  const handleNext = () => {
    if (!device_id.trim()) {
      Alert.alert("Error", "Please enter a valid Device ID.");
      return;
    }
    navigation.navigate("SignupUser", { device_id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Device ID</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Device ID" 
        value={device_id} 
        onChangeText={setDeviceId} 
        autoCapitalize="none" 
      />
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.replace("Login")} style={styles.backButton}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: { width: "80%", height: 40, borderColor: "#ccc", borderWidth: 1, marginBottom: 10, padding: 8, borderRadius: 5, backgroundColor: "#fff" },
  button: { backgroundColor: "#007BFF", padding: 10, borderRadius: 5, width: "80%", alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  backButton: { marginTop: 10 },
  backText: { color: "#007BFF", fontSize: 14 },
});

export default SignupDeviceScreen;
