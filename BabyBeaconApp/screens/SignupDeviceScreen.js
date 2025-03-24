import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, SHARED_STYLES } from "../styles/theme";

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
      <Text style={styles.title}>Enter Device ID</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Device ID" 
        value={device_id} 
        onChangeText={setDeviceId} 
        autoCapitalize="none" 
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace("Login")}>
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...SHARED_STYLES.container,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...SHARED_STYLES.title
  },
  input: {
    ...SHARED_STYLES.input
  },
  primaryButton: {
    ...SHARED_STYLES.primaryButton
  },
  secondaryButton: {
    ...SHARED_STYLES.secondaryButton
  },
  buttonText: {
    ...SHARED_STYLES.buttonText
  }
});

export default SignupDeviceScreen;
