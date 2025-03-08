import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";

const HomeScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [scanningBaby, setScanningBaby] = useState(null); // Default: null
  const [responses, setResponses] = useState([]);
  const [activeResponse, setActiveResponse] = useState("None");
  const [activeResponseUrl, setActiveResponseUrl] = useState(null);

  const handleResponseClick = async (responseKey) => {
    setActiveResponse(responseKey);
  
    const currentDeviceId = deviceId; // Use deviceId directly
    const currentScanningBaby = scanningBaby; // Use scanningBaby directly
    const storedUsername = await AsyncStorage.getItem("username");
    if (responseKey === "None") {
      setActiveResponseUrl(""); // Ensure empty string instead of null
      await updateDeviceResponse(currentDeviceId, ""); // Update Firestore
      return;
    }
  
    try {
      // 🔹 Fetch the response URL for the selected responseKey
      const response = await axios.get(`${API_URL}/get_response_url`, {
        params: {
          username: storedUsername,
          scanning_baby: currentScanningBaby,
          response_key: responseKey,
        },
      });
  
      if (response.data.status === "success") {
        const url = response.data.url;
        setActiveResponseUrl(url);
        await updateDeviceResponse(currentDeviceId, url); // 🔹 Update Firestore with new URL
      } else {
        console.error("Failed to fetch response URL:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching response URL:", error);
    }
  };
  
  // 🔹 Function to Update Firestore Device Response
  const updateDeviceResponse = async (deviceId, responseUrl) => {
    try {
      await axios.post(`${API_URL}/update_device_response`, {
        device_id: deviceId,
        response: responseUrl,
      });
      console.log(`✅ Updated Firestore: ${deviceId} -> ${responseUrl || "None"}`);
    } catch (error) {
      console.error("Error updating device response:", error);
    }
  };
  
  useEffect(() => {
    const fetchResponses = async (username, scanningBaby) => {
      try {
        const response = await axios.get(`${API_URL}/get_baby_responses`, {
          params: { username, scanning_baby: scanningBaby },
        });
    
        if (response.data.status === "success") {
          setResponses(response.data.responses || []);
        } else {
          console.error("Failed to fetch responses:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching responses:", error);
      }
    };
    
    const fetchProfile = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        if (!storedUsername) {
          console.error("No username found in storage.");
          return;
        }
    
        const response = await axios.get(`${API_URL}/get_profile`, {
          params: { username: storedUsername },
        });
    
        if (response.data.status === "success") {
          const userData = response.data.data;
    
          if (userData.scanning_baby) {
            setScanningBaby(userData.scanning_baby);
            await AsyncStorage.setItem("scanning_baby", userData.scanning_baby);
            fetchResponses(storedUsername, userData.scanning_baby); // Fetch responses
          } else {
            setScanningBaby(null);
            setResponses([]); // Reset responses
          }
    
          if (userData.device_id) {
            setDeviceId(userData.device_id);
            await AsyncStorage.setItem("device_id", userData.device_id);
          }
        } else {
          console.error("Profile Fetch Failed:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };    

    fetchProfile();
  }, []);

  const toggleScan = async () => {
    if (!deviceId) {
      console.error("Device ID is missing.");
      return;
    }

    const action = isScanning ? "stop_scan" : "start_scan";
    try {
      const response = await axios.post(`${API_URL}/${action}`, {
        device_id: deviceId,
      });

      if (response.data.status === "success") {
        setIsScanning(!isScanning);
      } else {
        console.error("Error toggling scan:", response.data.message);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{scanningBaby ? `Beacon on ${scanningBaby}` : "BabyBeacon"}</Text>
  
      <TouchableOpacity
        style={[styles.button, isScanning ? styles.stopButton : styles.startButton]}
        onPress={toggleScan}
      >
        <Text style={styles.buttonText}>{isScanning ? "Stop" : "Start"}</Text>
      </TouchableOpacity>
      
      <View style={styles.ghostBoxResponses}>
        <Text style={styles.responseTitle}>
          {scanningBaby ? `Responses for ${scanningBaby} Playing:` : "Responses"}
        </Text>

        {/* Spacer for first button */}
        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={[
            styles.responseButton,
            activeResponse === "None" ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => handleResponseClick("None")}
        >
          <Text style={styles.responseButtonText}>None</Text>
        </TouchableOpacity>

        {responses.length > 0 ? (
          responses.map((response, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.responseButton,
                activeResponse === response ? styles.activeButton : styles.inactiveButton,
              ]}
              onPress={() => handleResponseClick(response)}
            >
              <Text style={styles.responseButtonText}>{response}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResponsesText}>No responses available.</Text>
        )}

      </View>
      {/* Ghost Display Box - Ride Status */}
      <View style={styles.ghostBox}>
        <Text style={styles.ghostText}>
          {isScanning ? "Waiting for scans" : "Start the Ride"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingTop: 50, // Moves content towards the top
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,   // ⬅ Reduce gap between Home & Title
    marginTop: -30,     // ⬅ Move up closer to "Home"
  },
  button: {
    padding: 15,
    borderRadius: 10,
    width: 150,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#007BFF",
  },
  stopButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  ghostBox: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 2,
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
    width: "90%",
  },
  ghostBoxResponses: {
    flex: 1.2,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    width: "90%",
    marginTop: 20, // Moves it to top above scan box
  },
  responseButton: {
    paddingVertical: 8,  // ⬅ Thinner buttons (wrap font)
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 4,   // ⬅ Reduce gap between buttons
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: "#28A745", // Green when active
  },
  inactiveButton: {
    backgroundColor: "#e2ffcc", // Light blue when inactive
  },
  responseButtonText: {
    fontSize: 18,
    fontWeight: "normal",
    color: "#000710",
  },
  ghostText: {
    fontSize: 16,
    color: "#888", // Light grey for ghost effect
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
});

export default HomeScreen;
