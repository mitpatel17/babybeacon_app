import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";
import { FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "react-native-vector-icons";
import { MaterialCommunityIcons } from "react-native-vector-icons";
import { COLORS } from "../styles/theme";

const BabyScreen = () => {
  const [screenKey, setScreenKey] = useState(0);
  const [babies, setBabies] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [responses, setResponses] = useState([]);
  const [starredResponses, setStarredResponses] = useState([]);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newResponseName, setNewResponseName] = useState("");
  const [newResponseUrl, setNewResponseUrl] = useState("");
  const [babyModalVisible, setBabyModalVisible] = useState(false);
  const [newBaby, setNewBaby] = useState("");

  useEffect(() => {
    fetchBabies();
  }, [screenKey]);

  useEffect(() => {
    if (selectedBaby) {
      fetchResponses(selectedBaby);
    }
  }, [selectedBaby]);

  const handleAddBaby = async () => {
    if (!newBaby.trim()) {
      Alert.alert("Error", "Baby name cannot be empty.");
      return;
    }
  
    try {
      const username = await AsyncStorage.getItem("username");
      const response = await axios.post(`${API_URL}/add_baby`, { username, baby_name: newBaby });
  
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
    if (!babyName || typeof babyName !== "string") {
      console.error("Invalid baby name:", babyName);
      return;
    }
  
    try {
      const username = await AsyncStorage.getItem("username");
      const response = await axios.post(`${API_URL}/remove_baby`, { username, baby_name: babyName });
  
      if (response.data.status === "success") {
        setBabies(babies.filter(b => b !== babyName));
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Remove Baby Error:", error);
      Alert.alert("Error", "Could not remove baby.");
    }
  };
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
      updatedStarredResponses = updatedStarredResponses.filter(
        (r) => r !== responseText
      );
    } else {
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
    } catch (error) {
      console.error("Error updating starred responses:", error);
    }
  };

  // Delete response if it's not starred
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
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Responses</Text>
      
      {/* Baby tabs selection - updated styling */}
      <View style={styles.babyTabsContainer}>
        {babies.map((baby, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.babyTab,
              selectedBaby === baby && styles.activeBabyTab
            ]}
            onPress={() => handleBabyChange(baby)}
          >
            <Text 
              style={[
                styles.babyTabText,
                selectedBaby === baby && styles.activeBabyTabText
              ]}
            >
              {baby}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.responsesContainer}>
        <Text style={styles.sectionTitle}>Responses for {selectedBaby}:</Text>
        
        {/* Responses list - updated styling */}
        <View style={styles.responsesList}>
          {responses.length === 0 ? (
            <Text style={styles.noResponsesText}>No responses added yet.</Text>
          ) : (
            responses.map((response, index) => (
              <View key={index} style={styles.responseItem}>
                <TouchableOpacity 
                  onPress={() => toggleStarResponse(response)} 
                  style={styles.favoriteIcon}
                >
                  <Ionicons 
                    name={starredResponses.includes(response) ? "star" : "star-outline"} 
                    size={24} 
                    color={starredResponses.includes(response) ? "#FFD700" : "#888888"} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.responseText}>{response}</Text>
                
                <TouchableOpacity 
                  onPress={() => deleteResponse(response)} 
                  disabled={starredResponses.includes(response)}
                  style={styles.deleteIcon}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={24} 
                    color={starredResponses.includes(response) ? "#888888" : "#FF4C4C"}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        
        {/* Add Response button - updated styling */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Response</Text>
        </TouchableOpacity>
        
        {/* Keep Update Babies button with the same functionality */}
        <TouchableOpacity style={styles.updateButton} onPress={() => setBabyModalVisible(true)}>
          <Text style={styles.updateButtonText}>Update Babies</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={babyModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Babies</Text>

            <TextInput 
              style={styles.input} 
              placeholder="Enter Baby Name" 
              value={newBaby} 
              onChangeText={setNewBaby} 
            />
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddBaby}>
              <Text style={styles.addButtonText}>Add Baby</Text>
            </TouchableOpacity>

            {babies.length > 0 ? (
              babies.map((baby, index) => (
                <View key={index} style={styles.babyItem}>
                  <Text style={styles.babyText}>{String(baby)}</Text>  
                  <TouchableOpacity onPress={() => handleRemoveBaby(baby)}>
                    <FontAwesome name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noResponsesText}>No babies found.</Text>
            )}

            <TouchableOpacity onPress={() => setBabyModalVisible(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

// Updated styles to match the image
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    color: "#333",
  },
  babyTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  babyTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  activeBabyTab: {
    backgroundColor: COLORS.primary,
  },
  babyTabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeBabyTabText: {
    color: "#fff",
  },
  responsesContainer: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  responsesList: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 20,
  },
  noResponsesText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
  },
  responseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  favoriteIcon: {
    marginRight: 10,
    width: 30,
  },
  responseText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  deleteIcon: {
    width: 30,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
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
  babyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  babyText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  closeModalText: {
    fontSize: 18,
    color: "#007BFF",
  },  
});

export default BabyScreen;
