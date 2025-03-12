import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const HomeScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [scanningBaby, setScanningBaby] = useState(null); // Default: null
  const [responses, setStarredResponses] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [activeResponse, setActiveResponse] = useState("None");
  const [currentRideId, setCurrentRideId] = useState(null);
  const [scans, setScans] = useState([]);

  const handleResponseClick = async (responseKey) => {
    setActiveResponse(responseKey);
  
    const currentDeviceId = deviceId;
    const currentScanningBaby = scanningBaby;
    const storedUsername = await AsyncStorage.getItem("username");
  
    if (responseKey === "None") {
      setActiveResponseUrl(""); // Ensure empty string
      await updateDeviceResponse(currentDeviceId, "");
      return;
    }
  
    try {
      const response = await axios.get(`${API_URL}/get_response_url`, {
        params: {
          username: storedUsername,
          scanning_baby: currentScanningBaby,
          response_key: responseKey,  // Pass the selected response key
        },
      });
  
      if (response.data.status === "success") {
        const url = response.data.url;
        setActiveResponseUrl(url);
        await updateDeviceResponse(currentDeviceId, url);
      } else {
        console.error("Failed to fetch response URL:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching response URL:", error);
    }
  };  

  const handleRandomClick = async () => {
    if (allResponses.length === 0) {
      console.error("No responses available to randomize.");
      return;
    }
  
    // 🎲 Pick a random response from all available response keys
    const randomIndex = Math.floor(Math.random() * allResponses.length);
    const randomResponse = allResponses[randomIndex];
  
    console.log(`🎲 Selected Random Response: ${randomResponse}`);
  
    setActiveResponse("Random"); // Highlight the Random button
    handleResponseClick(randomResponse); // Play the selected response
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

  const toggleScan = async () => {
    const storedUsername = await AsyncStorage.getItem("username"); 
    if (!deviceId || !storedUsername) {
      console.error("Device ID or username is missing.");
      return;
    }
  
    const action = isScanning ? "stop_scan" : "start_scan";
    try {
      const response = await axios.post(`${API_URL}/${action}`, {
        device_id: deviceId,
      });
  
      if (response.data.status === "success") {
        setIsScanning(!isScanning);
  
        if (!isScanning) {
          // ✅ Only clear scans when starting a new session
          setScans([]);  
          startRidePolling(storedUsername);
        }
      } else {
        console.error("Error toggling scan:", response.data.message);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };  

  const startRidePolling = async (username) => {
    try {
      // Fetch last_ride_Id from user profile
      const profileResponse = await axios.get(`${API_URL}/get_profile`, {
        params: { username },
      });

      if (profileResponse.data.status === "success") {
        let lastRideId = parseInt(profileResponse.data.data.last_ride_Id || "0") + 1;
        setCurrentRideId(`ride_${lastRideId}`);

        // Start polling every 3 seconds
        pollForScans(lastRideId);
      } else {
        console.error("Failed to fetch last ride ID:", profileResponse.data.message);
      }
    } catch (error) {
      console.error("Error fetching last ride ID:", error);
    }
  };

  let pollingInterval; 

  const pollForScans = async (rideId) => {
    console.log("🚀 Starting scan polling for Ride ID:", rideId);
  
    pollingInterval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`${API_URL}/get_device_status`, {
          params: { device_id: deviceId },
        });
  
        if (statusResponse.data.status === "success") {
          console.log("📡 Device status:", statusResponse.data.device_status);
  
          if (statusResponse.data.device_status === "idle") {
            clearInterval(pollingInterval);
            setIsScanning(false);
            console.log("🛑 Stopping polling - Device is idle.");
            return;
          }
        }
  
        const rideResponse = await axios.get(`${API_URL}/get_ride_data`, {
          params: { device_id: deviceId, ride_id: `ride_${rideId}` },
        });
  
        if (rideResponse.data.status === "success") {
          console.log("✅ Ride scan data:", rideResponse.data);
  
          const scanEntries = Object.entries(rideResponse.data.scans || {}).map(([key, value]) => ({
            id: key,
            ...value,
          }));
  
          const filteredScans = scanEntries.filter((scan) => scan.id.includes("scan"));
  
          filteredScans.sort((a, b) => parseInt(b.id.replace("scan", "")) - parseInt(a.id.replace("scan", "")));
  
          setScans((prevScans) => {
            const newScans = filteredScans.filter((newScan) =>
              !prevScans.some((existingScan) => existingScan.id === newScan.id)
            );
  
            if (newScans.length === 0) return prevScans;
  
            return [...newScans, ...prevScans];
          });
  
          console.log("📊 Updated scans in state:", filteredScans);
        } else {
          console.error("⚠️ Failed to fetch ride data:", rideResponse.data.message);
        }
      } catch (error) {
        console.error("❌ Error polling for scans:", error);
      }
    }, 3000);
  };
  
  const stopRidePolling = () => {
    clearInterval(pollingInterval);
  };

  const fetchAllResponses = async (username, scanningBaby) => {
    try {
      const response = await axios.get(`${API_URL}/get_baby_responses`, {  
        params: { username, scanning_baby: scanningBaby },
      });
  
      if (response.data.status === "success") {
        console.log("Fetched Data:", response.data.responses); // Debugging line
  
        // ✅ Directly store the response array (not Object.keys)
        setAllResponses(response.data.responses || []);
        setStarredResponses(response.data.starred_responses || []);
  
        console.log("Stored Responses:", response.data.responses); // Debugging line
      } else {
        console.error("Failed to fetch responses:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };   

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
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
          if (userData.device_id) {
            setDeviceId(userData.device_id);
            console.log(`✅ Device ID set: ${userData.device_id}`);
          } else {
            console.error("🚨 Device ID not found in user profile.");
          }
          if (userData.scanning_baby) {
            setScanningBaby(userData.scanning_baby);
            fetchAllResponses(storedUsername, userData.scanning_baby);
          }
        }
      };
  
      fetchProfile();
    }, [])
  );

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
        <Text style={styles.nowPlayingText}>
        Now Playing: {activeResponse}
      </Text>

        {/* Row: None + Random */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginVertical: 6 }}>
          <TouchableOpacity
            style={[
              styles.responseButton,
              activeResponse === "None" ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={() => handleResponseClick("None")}
          >
            <Text style={styles.responseButtonText}>None</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.responseButton,
              activeResponse === "Random" ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={handleRandomClick}
          >
            <Text style={styles.responseButtonText}>Random</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.responseGrid}>
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
      </View>

      <View style={styles.ghostBox}>
        <Text style={styles.ghostText}>
          {!isScanning
            ? "Waiting to start!"
            : scans.length === 0
            ? "Waiting for scans..."
            : "Latest Scans:"}
        </Text>

        <ScrollView style={styles.scanContainer} nestedScrollEnabled={true}>
          {scans.map((scan) => (
            <View key={scan.id} style={styles.scanNotification}>
              <Text style={styles.scanText}>
                {scan.id}: {scan.emotion} ({scan.accuracy}%)
              </Text>
            </View>
          ))}
        </ScrollView>
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
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: -30,
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
  ghostBoxResponses: {
    flex: 1.2,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 10,
    borderWidth: 2,
    borderColor: "#bbb",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    width: "90%",
    marginBottom: 15,
    marginTop: 10,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  responseGrid: {
    flexDirection: "row",
    flexWrap: "wrap", // Allows responses to move to new rows
    justifyContent: "space-between", // Spread across the width
    width: "100%", // Ensures full width usage
  },
  responseButton: {
    flex: 1,              // Let each button fill available space
    margin: 5,            // Small space between buttons
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#e2ffcc", // default
    minWidth: "30%",      // Each button takes up 30% of the row
    maxWidth: "45%",      // Prevents buttons from being too wide
  },
  activeButton: {
    backgroundColor: "#28A745", // green when active
  },
  inactiveButton: {
    backgroundColor: "#e2ffcc",
  },
  responseButtonText: {
    fontSize: 16,
    color: "#000710",
  },
  noResponsesText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },
  ghostBox: {
    flex: 2,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    width: "90%",
    minHeight: 80,
    maxHeight: 300,
    overflow: "hidden",
  },
  ghostText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#444",
    textAlign: "center",
    marginBottom: 10,
  },
  scanContainer: {
    flexGrow: 1,
    maxHeight: 250,
    width: "100%",
    paddingBottom: 10,
  },
  scanNotification: {
    width: "100%",
    backgroundColor: "#e2f0ff",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007BFF",
    alignItems: "flex-start",
    paddingLeft: 15,
  },
  scanText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#003366",
  },
});

export default HomeScreen;
