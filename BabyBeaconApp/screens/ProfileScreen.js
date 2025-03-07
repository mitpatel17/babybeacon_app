import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Modal, TouchableOpacity } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "../config";
import { FontAwesome } from "@expo/vector-icons"; // Import for icons

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState({});
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [babyModalVisible, setBabyModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newBaby, setNewBaby] = useState("");
  const [babies, setBabies] = useState([]);

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
          setBabies(fetchedUser.babies || []);
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
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      Alert.alert("Error", "Could not update profile.");
    }
  };

  const handleAddBaby = async () => {
    if (!newBaby.trim()) {
      Alert.alert("Error", "Baby name cannot be empty.");
      return;
    }

    try {
      const username = await AsyncStorage.getItem("username");
      const response = await axios.post(`${API_BASE_URL}/add_baby`, { username, baby_name: newBaby });

      if (response.data.status === "success") {
        setBabies([...babies, newBaby]);
        setNewBaby("");
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Add Baby Error:", error);
      Alert.alert("Error", "Could not add baby.");
    }
  };

  const handleRemoveBaby = async (babyName) => {
    try {
      const username = await AsyncStorage.getItem("username");
      const response = await axios.post(`${API_BASE_URL}/remove_baby`, { username, baby_name: babyName });

      if (response.data.status === "success") {
        setBabies(babies.filter((b) => b !== babyName));
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Remove Baby Error:", error);
      Alert.alert("Error", "Could not remove baby.");
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileContainer}>
        <Text style={styles.label}>Device ID:</Text>
        <TextInput style={styles.input} value={updatedData.device_id || ""} editable={editing} onChangeText={(text) => setUpdatedData({ ...updatedData, device_id: text })} />

        <Text style={styles.label}>Name:</Text>
        <TextInput style={styles.input} value={updatedData.name || ""} editable={editing} onChangeText={(text) => setUpdatedData({ ...updatedData, name: text })} />

        <Text style={styles.label}>Email:</Text>
        <TextInput style={styles.input} value={updatedData.email || ""} editable={editing} onChangeText={(text) => setUpdatedData({ ...updatedData, email: text })} />

        <Text style={styles.label}>Phone Number:</Text>
        <TextInput style={styles.input} value={updatedData.phone_number || ""} editable={editing} onChangeText={(text) => setUpdatedData({ ...updatedData, phone_number: text })} />

        {/* Edit Profile Button */}
        <TouchableOpacity style={editing ? styles.saveButton : styles.editButton} onPress={() => (editing ? handleUpdateProfile() : setEditing(true))}>
          <Text style={styles.buttonText}>{editing ? "Save Changes" : "Edit Profile"}</Text>
        </TouchableOpacity>

        {/* Update Babies Button */}
        <TouchableOpacity style={styles.greenButton} onPress={() => setBabyModalVisible(true)}>
          <Text style={styles.buttonText}>Update Babies</Text>
        </TouchableOpacity>

        {/* Change Password Button ✅ Fixes applied here */}
        <TouchableOpacity id="change-password-btn" style={styles.blueButton} onPress={() => setPasswordModalVisible(true)}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal ✅ */}
      <Modal id="change-password-modal" visible={passwordModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput style={styles.input} placeholder="Old Password" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
            <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

            <TouchableOpacity style={styles.greenButton} onPress={handleChangePassword}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.blueButton} onPress={() => setPasswordModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Update Babies Modal (with grey background) */}
      <Modal visible={babyModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Babies</Text>

            <TextInput style={styles.input} placeholder="Enter Baby Name" value={newBaby} onChangeText={setNewBaby} />
            <TouchableOpacity style={styles.greenButton} onPress={handleAddBaby}>
              <Text style={styles.buttonText}>Add Baby</Text>
            </TouchableOpacity>

            {babies.map((baby, index) => (
              <View key={index} style={styles.babyItem}>
                <Text style={styles.babyText}>{baby.name || baby}</Text>  {/* ✅ Extract name correctly */}
                <TouchableOpacity onPress={() => handleRemoveBaby(baby.name || baby)}>
                  <FontAwesome name="trash" size={20} color="red" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.blueButton} onPress={() => setBabyModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  profileContainer: { width: "100%", alignItems: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10, alignSelf: "flex-start", marginLeft: 20 },
  input: { width: "90%", height: 40, borderColor: "#ccc", borderWidth: 1, marginBottom: 15, padding: 8, borderRadius: 5, backgroundColor: "#f9f9f9" },

  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "85%", backgroundColor: "white", padding: 20, borderRadius: 10, alignItems: "center" },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  
  editButton: { backgroundColor: "#FFA500", padding: 12, borderRadius: 5, width: "90%", alignItems: "center", marginTop: 10 },
  saveButton: { backgroundColor: "#28A745", padding: 12, borderRadius: 5, width: "90%", alignItems: "center", marginTop: 10 },
  blueButton: { backgroundColor: "#007BFF", padding: 12, borderRadius: 5, width: "90%", alignItems: "center", marginTop: 10 },
  greenButton: { backgroundColor: "#28A745", padding: 12, borderRadius: 5, width: "90%", alignItems: "center", marginTop: 10 },

  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ProfileScreen;
