import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import axios from "axios";
import API_BASE_URL from "../config"; // Ensure this is correctly set

const SignupBabyScreen = ({ route }) => {
  const navigation = useNavigation();
  const [babies, setBabies] = useState([""]); // Start with one baby input

  // Retrieve user details from previous screens
  const { device_id, name, email, phone_number, username, password } = route.params;

  const addBaby = () => {
    setBabies([...babies, ""]);
  };

  const updateBabyName = (index, name) => {
    const newBabies = [...babies];
    newBabies[index] = name;
    setBabies(newBabies);
  };

  const handleSignup = async () => {
    if (babies.some(baby => baby.trim() === "")) {
      Alert.alert("Error", "All baby names must be filled out.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        device_id: device_id.trim(),
        name: name.trim(),
        email: email.trim(),
        phone_number: phone_number.trim(),
        username: username.trim(),
        password: password.trim(),
        baby: babies.map(baby => baby.trim()),
      });

      if (response.data.status === "success") {
        Alert.alert("Signup Successful", "Your account has been created.");
        navigation.replace("Login");
      } else {
        Alert.alert("Signup Failed", response.data.message);
      }
    } catch (error) {
      console.error("Signup Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Babies</Text>
        
        {babies.map((baby, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Baby ${index + 1} Name`}
            value={baby}
            onChangeText={(text) => updateBabyName(index, text)}
          />
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addBaby}>
          <Text style={styles.buttonText}>+ Add Another Baby</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSignup}>
          <Text style={styles.buttonText}>Complete Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flexGrow: 1,
    paddingTop: 50, // Moves content down to avoid the notch
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  backButton: {
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  backText: {
    color: "#007BFF",
    fontSize: 16,
  },
});

export default SignupBabyScreen;
