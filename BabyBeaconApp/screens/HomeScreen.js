import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const HomeScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [scanningBaby, setScanningBaby] = useState(null); // Default: null
  const [responses, setStarredResponses] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [activeResponse, setActiveResponse] = useState("None");
  const [activeUrl, setActiveResponseUrl] = useState("None");
  const [currentRideId, setCurrentRideId] = useState(null);
  const [scans, setScans] = useState([]);
  const [showResponsePopup, setShowResponsePopup] = useState(false);
  const [triggeredResponse, setTriggeredResponse] = useState("");
  const NEGATIVE_EMOTIONS = ["Angry", "Disgust", "Fear", "Sad"];

  const getEmotionColor = (emotion) => {
    if (NEGATIVE_EMOTIONS.includes(emotion)) return "#FF4C4C"; // 🔴 Red for negative
    if (emotion === "Happy") return "#4CAF50"; // 🟢 Green for Happy
    return "#FFD700"; // 🟡 Yellow for Neutral (any others)
  };

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

        // SHOW POPUP
        setTriggeredResponse(responseKey);
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
  
          let newScans = [];
          setScans((prevScans) => {
            newScans = filteredScans.filter((newScan) =>
              !prevScans.some((existingScan) => existingScan.id === newScan.id)
            );
  
            console.log(`🔎 New scans detected:`, newScans); // <==== SEE NEW SCANS HERE
  
            if (newScans.length === 0) return prevScans;
  
            return [...newScans, ...prevScans];
          });
  
          // Wait a little to ensure setScans finishes updating
          setTimeout(() => {
            if (newScans.length > 0) {
              newScans.forEach(async (scan) => {
                if (NEGATIVE_EMOTIONS.includes(scan.emotion)) {
                  console.log(`🚨 Negative Emotion Detected: ${scan.emotion} in ${scan.id}`);
                  
                  let selectedResponse = activeResponse;
                  
                  if (activeResponse === "None" && allResponses.length > 0) {
                    // Pick random response
                    const randomIndex = Math.floor(Math.random() * allResponses.length);
                    selectedResponse = allResponses[randomIndex];
                    console.log(`🎶 Auto-playing response: ${selectedResponse}`);
              
                    // Fetch response URL for selected random response
                    const storedUsername = await AsyncStorage.getItem("username");
                    const response = await axios.get(`${API_URL}/get_response_url`, {
                      params: {
                        username: storedUsername,
                        scanning_baby: scanningBaby,
                        response_key: selectedResponse,
                      },
                    });
              
                    if (response.data.status === "success") {
                      const url = response.data.url;
                      setActiveResponse(selectedResponse);
                      setActiveResponseUrl(url);
              
                      // 🔹 Update Firestore with new response URL
                      await updateDeviceResponse(deviceId, url);
                    } else {
                      console.error("Failed to fetch response URL for random:", response.data.message);
                    }
                  } else {
                    console.log(`⏯️ Response "${activeResponse}" already playing, skipping auto-play`);
                  }
              
                  // Show popup with whichever response is now playing
                  setTriggeredResponse(selectedResponse);
                  setShowResponsePopup(true);
                  setTimeout(() => {
                    setShowResponsePopup(false);
                  }, 5000);
                }
              });                           
            }
          }, 100); // short delay
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
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beacon on Billy</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isScanning ? '#FF3B30' : '#8CC63F' }]} />
          <Text style={styles.statusText}>{isScanning ? 'Scanning' : 'Idle'}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.scanButton, 
            { backgroundColor: isScanning ? '#FF3B30' : '#8CC63F' }
          ]} 
          onPress={toggleScan}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Stop Scan' : 'Start Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Responses for Billy</Text>
        <Text style={styles.nowPlayingText}>Now Playing: {activeResponse}</Text>
        
        <View style={styles.responseGrid}>
          <TouchableOpacity 
            style={[styles.responseButton, activeResponse === 'None' && styles.activeResponse]} 
            onPress={() => handleResponseClick('None')}
          >
            <Text style={styles.responseText}>None</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.responseButton, activeResponse === 'Random' && styles.activeResponse]} 
            onPress={handleRandomClick}
          >
            <Text style={styles.responseText}>Random</Text>
          </TouchableOpacity>
          
          {/* Add more response buttons based on your data */}
          <TouchableOpacity 
            style={[styles.responseButton, activeResponse === 'Hush Little Baby' && styles.activeResponse]} 
            onPress={() => handleResponseClick('Hush Little Baby')}
          >
            <Text style={styles.responseText}>Hush Little Baby</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.responseButton, activeResponse === 'Twinkle Twinkle' && styles.activeResponse]} 
            onPress={() => handleResponseClick('Twinkle Twinkle')}
          >
            <Text style={styles.responseText}>Twinkle Twinkle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.responseButton, activeResponse === 'Wheels on Bus' && styles.activeResponse]} 
            onPress={() => handleResponseClick('Wheels on Bus')}
          >
            <Text style={styles.responseText}>Wheels on Bus</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Baby Notifications</Text>
        <Text style={styles.notificationText}>
          Start scanning to receive baby state notifications
        </Text>
        
        {isScanning && scans.map((scan) => (
          <View key={scan.id} style={styles.notificationItem}>
            <Text style={styles.notificationItemText}>{scan.id}: {scan.emotion} ({scan.accuracy}%)</Text>
          </View>
        ))}
      </View>

      {showResponsePopup && (
        <TouchableOpacity
          style={styles.popupBox}
          activeOpacity={0.8}
          onPress={() => setShowResponsePopup(false)} // tap to dismiss
        >
          <Text style={styles.popupTitle}>Response Triggered!</Text>
          <Text style={styles.popupMessage}>Auto-playing: {triggeredResponse}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
  },
  scanButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nowPlayingText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  responseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  responseButton: {
    width: '48%',
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeResponse: {
    backgroundColor: '#8CC63F',
  },
  responseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  notificationItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 8,
  },
  notificationItemText: {
    fontSize: 14,
  },
  popupBox: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007BFF",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 10, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007BFF",
  },
  popupMessage: {
    fontSize: 16,
    color: "#333",
  },
});

export default HomeScreen;
