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
  const [babies, setBabies] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [responses, setResponses] = useState([]);
  const [starredResponses, setStarredResponses] = useState([]);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newResponseName, setNewResponseName] = useState("");
  const [newResponseUrl, setNewResponseUrl] = useState("");

  useEffect(() => {
    fetchBabies();
  }, []);

  useEffect(() => {
    if (selectedBaby) {
      fetchResponses(selectedBaby);
    }
  }, [selectedBaby]);

  const fetchBabies = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const response = await axios.get(`${API_URL}/get_profile`, { params: { username: storedUsername } });


      if (response.data.status === "success") {
        const userData = response.data.data;
        setBabies(userData.babies || []);
        setSelectedBaby(userData.scanning_baby || (userData.babies.length > 0 ? userData.babies[0] : null));

        if (userData.scanning_baby) {
          fetchResponses(userData.scanning_baby);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchResponses = async (babyName) => {
    try {
      const storedUsername = await AsyncStorage.getItem("username");
      const response = await axios.get(`${API_URL}/get_baby_responses`, { params: { username: storedUsername, scanning_baby: babyName } });

      if (response.data.status === "success") {
        setResponses(response.data.responses || []);
        setStarredResponses(response.data.starred_responses || []);
      }
    } catch (error) {
      console.error("Error fetching baby responses:", error);
    }
  };

  const handleBabyChange = async (babyName) => {
    setSelectedBaby(babyName);
    setPickerVisible(false);
    fetchResponses(babyName);

    const storedUsername = await AsyncStorage.getItem("username");
    try {
      await axios.post(`${API_URL}/update_profile`, {
        username: storedUsername,
        updates: { scanning_baby: babyName },
      });
    } catch (error) {
      console.error("Error updating scanning baby:", error);
    }
  };

  const toggleStarResponse = async (responseText) => {
    let updatedStarredResponses = [...starredResponses];

    if (updatedStarredResponses.includes(responseText)) {
      updatedStarredResponses = updatedStarredResponses.filter((r) => r !== responseText);
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
      console.log("Updated starred responses:", updatedStarredResponses);
    } catch (error) {
      console.error("Error updating starred responses:", error);
    }
  };

  const deleteResponse = async (responseText) => {
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

      console.log("Added new response:", newResponseName);
    } catch (error) {
      console.error("Error adding new response:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Baby Selected:</Text>

      <TouchableOpacity style={styles.pickerButton} onPress={() => setPickerVisible(true)}>
        <Text style={styles.pickerButtonText}>{selectedBaby || "Select a Baby"}</Text>
      </TouchableOpacity>

      <Modal visible={isPickerVisible} transparent={true} animationType="slide">
        <View style={styles.pickerModal}>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedBaby} onValueChange={handleBabyChange} style={styles.picker}>
              {babies.map((baby, index) => (
                <Picker.Item key={index} label={baby} value={baby} />
              ))}
            </Picker>
            <TouchableOpacity style={styles.closePicker} onPress={() => setPickerVisible(false)}>
              <Text style={styles.closePickerText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.responseBox}>
        <Text style={styles.responseTitle}>Responses:</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
          <FontAwesome name="plus-circle" size={24} color="#007BFF" style={styles.addIcon} />
        </TouchableOpacity>
        <ScrollView nestedScrollEnabled={true}>
          {responses.length > 0 ? (
            responses.map((response, index) => (
              <View key={index} style={styles.responseRow}>
                <TouchableOpacity onPress={() => toggleStarResponse(response)}>
                  <FontAwesome name={starredResponses.includes(response) ? "star" : "star-o"} size={24} color={starredResponses.includes(response) ? "#FFD700" : "#888"} />
                </TouchableOpacity>
                <Text style={styles.responseText}>{response}</Text>
                <TouchableOpacity onPress={() => deleteResponse(response)}>
                  <FontAwesome name="trash" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noResponsesText}>No responses available.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

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
  },
  responseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
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
    marginLeft: 10,
  },
  starIcon: {
    marginRight: 10,
  },
  trashIcon: {
    marginLeft: 10,
  },
  noResponsesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
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
  disabledButton: {
    backgroundColor: "#ccc",
  },
  closeModalText: {
    fontSize: 18,
    color: "#007BFF",
  },
  noResponsesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default BabyScreen;