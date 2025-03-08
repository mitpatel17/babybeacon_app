import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
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
  const [currentRideId, setCurrentRideId] = useState(null);
  const [scans, setScans] = useState([]);

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

  const toggleScan = async () => {
    const storedUsername = await AsyncStorage.getItem("username"); // Fetch username
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

  let pollingInterval; // Store interval globally

  const pollForScans = async (rideId) => {
    console.log("🚀 Starting scan polling for Ride ID:", rideId);
  
    pollingInterval = setInterval(async () => {
      try {
        // 🔹 Check device status first
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
  
        // 🔹 Fetch ride scans
        const rideResponse = await axios.get(`${API_URL}/get_ride_data`, {
          params: { device_id: deviceId, ride_id: `ride_${rideId}` },
        });
  
        if (rideResponse.data.status === "success") {
          console.log("✅ Ride scan data:", rideResponse.data);
  
          // Convert scan data into an array of objects
          const scanEntries = Object.entries(rideResponse.data.scans || {}).map(([key, value]) => ({
            id: key,
            ...value,
          }));
  
          // 🔹 Filter only scans with "scan" in the ID
          const filteredScans = scanEntries.filter((scan) => scan.id.includes("scan"));
  
          // Sort scans so the latest appears on top
          filteredScans.sort((a, b) => parseInt(b.id.replace("scan", "")) - parseInt(a.id.replace("scan", "")));
  
          // 🔹 Only add new scans that aren’t already in state
          setScans((prevScans) => {
            const newScans = filteredScans.filter((newScan) =>
              !prevScans.some((existingScan) => existingScan.id === newScan.id)
            );
  
            // If no new scans, return the same state (prevents duplicate stacking)
            if (newScans.length === 0) return prevScans;
  
            // 🔹 Ensure latest scans appear first
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
    clearInterval(pollingInterval); // ✅ Stop polling, but don't clear scans
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
    
          setCurrentRideId(userData.last_ride_Id);
    
          if (userData.scanning_baby) {
            setScanningBaby(userData.scanning_baby);
            await AsyncStorage.setItem("scanning_baby", userData.scanning_baby);
            fetchResponses(storedUsername, userData.scanning_baby); 
          } else {
            setScanningBaby(null);
            setResponses([]);
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
      <View style={styles.ghostBox}>
        {/* Keep "Waiting for scans..." even when scans arrive */}
        <Text style={styles.ghostText}>
          {!isScanning
            ? "Waiting to start!"
            : scans.length === 0
            ? "Waiting for scans..."
            : "Latest Scans:"}
        </Text>

        {/* Scrollable list of scans, latest on top */}
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
  ghostBox: {
    flex: 2, 
    justifyContent: "flex-start",  // Prevents stretching
    alignItems: "center",
    marginTop: 10,  // Add spacing
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    width: "90%",
    minHeight: 80,  // Ensures it doesn't disappear when empty
    maxHeight: 300, // Prevents overflow
    overflow: "hidden", // Ensures no content flows out
  },
  scanContainer: {
    flexGrow: 1,  
    maxHeight: 250, // Ensures scans don't push into other elements
    width: "100%",
    paddingBottom: 10,
  },
  scanNotification: {
    width: "100%", // ✅ Take full width of ghost box
    backgroundColor: "#e2f0ff",  
    padding: 12,
    marginVertical: 4, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007BFF",
    alignItems: "flex-start", // ✅ Align text to the left
    paddingLeft: 15, // ✅ Give a little left padding
  },
  scanText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#003366",
  },
  ghostBoxResponses: {
    flex: 1.2,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 10,
    borderWidth: 2, // 🔹 Ensure a visible border
    borderColor: "#bbb", // Light gray border
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    width: "90%",
    marginBottom: 15,
    marginTop: 10 // 🔹 Adds spacing between the two boxes
  },
  ghostText: {
    fontSize: 20, // ⬆ Bigger Title
    fontWeight: "bold",
    color: "#444",
    textAlign: "center",
    marginBottom: 10,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
});

export default HomeScreen;
