import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";
import { FontAwesome } from "@expo/vector-icons";

const BabyScreen = () => {
  const [screenKey, setScreenKey] = useState(0); // Forcing a full screen reload
  const [babies, setBabies] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [responses, setResponses] = useState([]);
  const [starredResponses, setStarredResponses] = useState([]);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newResponseName, setNewResponseName] = useState("");
  const [newResponseUrl, setNewResponseUrl] = useState("");

  // Load or reload babies whenever screenKey changes
  useEffect(() => {
    fetchBabies();
  }, [screenKey]);

  // Only fetch responses after selectedBaby is set
  useEffect(() => {
    if (selectedBaby) {
      fetchResponses(selectedBaby);
    }
  }, [selectedBaby]);

  // 1) Fetch user profile -> get baby list and scanning baby
  const fetchBabies = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const response = await axios.get(`${API_URL}/get_profile`, {
        params: { username: storedUsername },
      });

      if (response.data.status === "success") {
        const userData = response.data.data;
        setBabies(userData.babies || []);
        setSelectedBaby(
          userData.scanning_baby ||
            (userData.babies.length > 0 ? userData.babies[0] : null)
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // 2) Fetch baby responses & starred responses from /get_baby_responses
  const fetchResponses = async (babyName) => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const response = await axios.get(`${API_URL}/get_baby_responses`, {
        params: { username: storedUsername, scanning_baby: babyName },
      });

      if (response.data.status === "success") {
        // The server returns {"responses": [...], "starred_responses": [...]} 
        setResponses(response.data.responses || []);
        setStarredResponses(response.data.starred_responses || []);
      }
    } catch (error) {
      console.error("Error fetching baby responses:", error);
    }
  };

  // 3) Switch baby in Firestore, then reload entire screen
  const handleBabyChange = async (babyName) => {
    setPickerVisible(false);
    const storedUsername = await AsyncStorage.getItem("username");

    try {
      await axios.post(`${API_URL}/update_profile`, {
        username: storedUsername,
        updates: { scanning_baby: babyName },
      });

      // Force a full reload by incrementing screenKey
      setScreenKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating scanning baby:", error);
    }
  };

  // Add a new response in Firestore
  const addNewResponse = async () => {
    if (!newResponseName || !newResponseUrl) return;

    const storedUsername = await AsyncStorage.getItem("username");
    try {
      await axios.post(`${API_URL}/add_response`, {
        username: storedUsername,
        baby_name: selectedBaby,
        response_name: newResponseName,
        response_url: newResponseUrl,
      });

      setResponses([...responses, newResponseName]);
      setNewResponseName("");
      setNewResponseUrl("");
      setAddModalVisible(false);
    } catch (error) {
      console.error("Error adding new response:", error);
    }
  };

  // Star / Unstar a response
  const toggleStarResponse = async (responseText) => {
    let updatedStarredResponses = [...starredResponses];

    if (updatedStarredResponses.includes(responseText)) {
      // Unstar
      updatedStarredResponses = updatedStarredResponses.filter(
        (r) => r !== responseText
      );
    } else {
      // Star
      if (updatedStarredResponses.length < 3) {
        updatedStarredResponses.push(responseText);
      } else {
        alert("You can only star up to 3 responses. Unstar one before adding another.");
        return;
      }
    }

    setStarredResponses(updatedStarredResponses);

    const storedUsername = await AsyncStorage.getItem("username");
    try {
      await axios.post(`${API_URL}/update_starred_responses`, {
        username: storedUsername,
        baby_name: selectedBaby,
        starred_responses: updatedStarredResponses,
      });
      // Optionally re-fetch to ensure you have the latest data from Firestore
      // fetchResponses(selectedBaby);
    } catch (error) {
      console.error("Error updating starred responses:", error);
    }
  };

  // Delete response if it’s not starred
  const deleteResponse = async (responseText) => {
    if (starredResponses.includes(responseText)) {
      alert("Cannot delete a starred response. Please unstar first.");
      return;
    }

    const storedUsername = await AsyncStorage.getItem("username");
    try {
      await axios.post(`${API_URL}/delete_response`, {
        username: storedUsername,
        baby_name: selectedBaby,
        response: responseText,
      });

      setResponses(responses.filter((r) => r !== responseText));
      setStarredResponses(starredResponses.filter((r) => r !== responseText));
    } catch (error) {
      console.error("Error deleting response:", error);
    }
  };

  return (
    <View style={styles.container} key={screenKey}>
      <Text style={styles.header}>Baby Selected:</Text>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setPickerVisible(true)}
      >
        <Text style={styles.pickerButtonText}>
          {selectedBaby || "Select a Baby"}
        </Text>
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal visible={isPickerVisible} transparent={true} animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedBaby}
              onValueChange={(itemValue) => handleBabyChange(itemValue)}
              style={styles.picker}
            >
              {babies.map((baby, index) => (
                <Picker.Item key={index} label={baby} value={baby} />
              ))}
            </Picker>
            <TouchableOpacity
              style={styles.closePicker}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.closePickerText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Response List */}
      <View style={styles.responseBox}>
        <View style={styles.responseHeader}>
          <Text style={styles.responseTitle}>Responses:</Text>
          <TouchableOpacity onPress={() => setAddModalVisible(true)}>
            <FontAwesome name="plus-circle" size={24} color="#007BFF" />
          </TouchableOpacity>
        </View>

        <ScrollView nestedScrollEnabled={true}>
          {responses.length > 0 ? (
            responses.map((response, index) => (
              <View key={index} style={styles.responseRow}>
                <TouchableOpacity onPress={() => toggleStarResponse(response)}>
                  <FontAwesome
                    name={starredResponses.includes(response) ? "star" : "star-o"}
                    size={24}
                    color={
                      starredResponses.includes(response) ? "#FFD700" : "#888"
                    }
                  />
                </TouchableOpacity>
                <Text style={styles.responseText}>{response}</Text>

                {starredResponses.includes(response) ? (
                  // Show disabled trash if starred
                  <FontAwesome name="trash" size={24} color="#ccc" />
                ) : (
                  <TouchableOpacity onPress={() => deleteResponse(response)}>
                    <FontAwesome name="trash" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noResponsesText}>No responses available.</Text>
          )}
        </ScrollView>
      </View>

      {/* Add Response Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Response</Text>
            <TextInput
              style={styles.input}
              placeholder="Response Name"
              value={newResponseName}
              onChangeText={setNewResponseName}
            />
            <TextInput
              style={styles.input}
              placeholder="Response URL"
              value={newResponseUrl}
              onChangeText={setNewResponseUrl}
            />
            <TouchableOpacity style={styles.addButton} onPress={addNewResponse}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// -------------- STYLES --------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    width: "80%",
    padding: 10,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    marginBottom: 20,
  },
  pickerButtonText: {
    fontSize: 18,
  },
  pickerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  picker: {
    width: "100%",
    height: 200,
  },
  closePicker: {
    marginTop: 10,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  closePickerText: {
    color: "#fff",
    fontSize: 18,
  },
  responseBox: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
    marginTop: 10,
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  responseTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  responseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  responseText: {
    fontSize: 18,
    flex: 1,
    textAlign: "center",
  },
  noResponsesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  closeModalText: {
    fontSize: 18,
    color: "#007BFF",
  },
});

export default BabyScreen;
