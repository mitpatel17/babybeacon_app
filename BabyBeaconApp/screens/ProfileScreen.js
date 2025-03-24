import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Modal, TouchableOpacity } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config";
import { FontAwesome } from "@expo/vector-icons"; // Import for icons
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHARED_STYLES } from "../styles/theme";

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
        try {
          const username = await AsyncStorage.getItem("username");
          if (!username) {
            console.error("No username found in storage.");
            setLoading(false);
            return;
          }
      
          const response = await axios.get(`${API_BASE_URL}/get_profile`, { params: { username } });
      
          if (response.data.status === "success") {
            const fetchedUser = response.data.data;
            setUser(fetchedUser);
            setUpdatedData(fetchedUser);
          } else {
            console.error("Profile Fetch Failed:", response.data.message);
          }
        } catch (error) {
          console.error("Profile Fetch Error:", error);
        }
        setLoading(false);
      };
      
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      const response = await axios.post(`${API_BASE_URL}/update_profile`, {
        username,
        updates: updatedData,
      });

      if (response.data.status === "success") {
        Alert.alert("Success", "Profile updated successfully.");
        setUser(updatedData);
        setEditing(false);
        setIsSaved(true);
        setTimeout(() => {
          setIsSaved(false);
        }, 2000);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      Alert.alert("Error", "Could not update profile.");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }

    try {
      const username = await AsyncStorage.getItem("username");
      const response = await axios.post(`${API_BASE_URL}/change_password`, {
        username,
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (response.data.status === "success") {
        Alert.alert("Success", "Password changed successfully.");
        setPasswordModalVisible(false); // Close modal on success
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Change Password Error:", error);
      Alert.alert("Error", "Could not change password.");
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all stored user data
      await AsyncStorage.removeItem('username');
      // Add any other stored items that need to be cleared
      
      // Navigate to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleEditProfile = () => {
    if (!editing) {
      setEditing(true);
      setIsSaved(false);
    } else {
      handleUpdateProfile();
      setEditing(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>View/Edit Profile</Text>

      <View style={styles.profileContainer}>
        <Text style={styles.inputLabel}>Device ID:</Text>
        <TextInput
          style={styles.input}
          value={updatedData.device_id || ""}
          editable={editing}
          onChangeText={(text) => setUpdatedData({ ...updatedData, device_id: text })}
        />

        <Text style={styles.inputLabel}>Name:</Text>
        <TextInput
          style={styles.input}
          value={updatedData.name || ""}
          editable={editing}
          onChangeText={(text) => setUpdatedData({ ...updatedData, name: text })}
        />

        <Text style={styles.inputLabel}>Email:</Text>
        <TextInput
          style={styles.input}
          value={updatedData.email || ""}
          editable={editing}
          onChangeText={(text) => setUpdatedData({ ...updatedData, email: text })}
        />

        <Text style={styles.inputLabel}>Phone Number:</Text>
        <TextInput
          style={styles.input}
          value={updatedData.phone_number || ""}
          editable={editing}
          onChangeText={(text) => setUpdatedData({ ...updatedData, phone_number: text })}
        />

        <TouchableOpacity 
          style={[
            styles.button, 
            editing ? styles.primaryButtonDark : (isSaved ? styles.primaryButtonDark : styles.primaryButton)
          ]} 
          onPress={handleEditProfile}
        >
          <Text style={styles.buttonText}>
            {editing ? "Save Changes" : (isSaved ? "Saved Changes" : "Edit Profile")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => setPasswordModalVisible(true)}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput style={styles.input} placeholder="Old Password" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
            <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

            <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setPasswordModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: SPACING.xl, 
    backgroundColor: COLORS.background, 
    alignItems: "center" 
  },
  title: { 
    fontSize: FONTS.sizes.xxlarge, 
    fontWeight: FONTS.weights.bold, 
    marginBottom: SPACING.l
  },
  profileContainer: { 
    width: "100%", 
    alignItems: "center" 
  },
  inputLabel: {
    fontSize: FONTS.sizes.medium,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.xs,
    alignSelf: 'flex-start',
    paddingLeft: SPACING.xs,
  },
  input: {
    ...SHARED_STYLES.input
  },
  modalContainer: { 
    ...SHARED_STYLES.modalContainer
  },
  modalContent: { 
    ...SHARED_STYLES.modalContent
  },
  modalTitle: { 
    ...SHARED_STYLES.modalTitle
  },
  
  button: {
    height: 50,
    borderRadius: BORDER_RADIUS.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.xs,
    width: '100%',
  },
  
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  
  primaryButtonDark: {
    backgroundColor: COLORS.primaryDark,
  },
  
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
  
  buttonText: {
    ...SHARED_STYLES.buttonText
  },

  formContainer: {
    width: '90%',
    alignSelf: 'center',
    padding: SPACING.l,
  },
});

export default ProfileScreen;
