import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { COLORS, FONTS, SPACING, SHARED_STYLES } from "../styles/theme";

const SignupUserScreen = ({ navigation, route }) => {
  const { device_id } = route.params;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNext = () => {
    if (!name || !email || !phone_number || !username || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    navigation.navigate("SignupBaby", { device_id, name, email, phone_number, username, password });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Details</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Full Name" 
        value={name} 
        onChangeText={setName} 
        autoCapitalize="words"
        textContentType="none"  // Prevents iOS AutoFill
        importantForAutofill="no"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        autoCapitalize="none"
        textContentType="emailAddress"  // Prevents auto-suggestions
        importantForAutofill="no"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Phone Number" 
        value={phone_number} 
        onChangeText={setPhoneNumber} 
        keyboardType="phone-pad" 
        textContentType="telephoneNumber" 
        importantForAutofill="no"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Username" 
        value={username} 
        onChangeText={setUsername} 
        autoCapitalize="none"
        textContentType="none"  // Disables autofill
        importantForAutofill="no"
      />

      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry
        textContentType="none" 
        importantForAutofill="no"
        autoCompleteType="off"
        autoCorrect={false} // Prevents auto-suggestions
        spellCheck={false} // Ensures no spell check
      />

      <TextInput 
        style={styles.input} 
        placeholder="Confirm Password" 
        value={confirmPassword} 
        onChangeText={setConfirmPassword} 
        secureTextEntry
        textContentType="none"
        importantForAutofill="no"
        autoCompleteType="off"
        autoCorrect={false}
        spellCheck={false}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace("Login")} style={styles.linkButton}>
        <Text style={styles.linkText}>Back to Login</Text>
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
    ...SHARED_STYLES.title
  },
  input: { 
    ...SHARED_STYLES.input,
    width: "100%",
  },
  primaryButton: { 
    ...SHARED_STYLES.primaryButton
  },
  secondaryButton: { 
    ...SHARED_STYLES.secondaryButton
  },
  buttonText: { 
    ...SHARED_STYLES.buttonText
  },
  linkButton: { 
    marginTop: SPACING.m
  },
  linkText: { 
    ...SHARED_STYLES.linkText
  },
});

export default SignupUserScreen;
