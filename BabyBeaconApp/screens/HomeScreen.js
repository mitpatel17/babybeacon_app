import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";

const HomeScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [scanningBaby, setScanningBaby] = useState(null); // Default: null

  useEffect(() => {
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

          // ✅ Store scanning_baby locally
          if (userData.scanning_baby) {
            setScanningBaby(userData.scanning_baby);
            await AsyncStorage.setItem("scanning_baby", userData.scanning_baby);
          } else {
            setScanningBaby(null);
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
      {/* 🔹 Dynamic Title Based on Scanning Baby */}
      <Text style={styles.header}>
        {scanningBaby ? `Beacon on ${scanningBaby}` : "BabyBeacon"}
      </Text>

      <TouchableOpacity
        style={[styles.button, isScanning ? styles.stopButton : styles.startButton]}
        onPress={toggleScan}
      >
        <Text style={styles.buttonText}>{isScanning ? "Stop" : "Start"}</Text>
      </TouchableOpacity>
      
      {/* 🔹 Dynamic Responses Box Title */}
      <View style={styles.ghostBoxResponses}>
        <Text style={styles.responseTitle}>
          {scanningBaby ? `Responses for ${scanningBaby}` : "Responses for Baby"}
        </Text>
      </View>
      
      {/* Ghost Display Box - Ride Status */}
      <View style={styles.ghostBox}>
        <Text style={styles.ghostText}>
          {isScanning ? "Waiting for scans" : "Ride is not started"}
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
    marginBottom: 20,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    width: "90%",
  },
  ghostBoxResponses: {
    flex: 1,
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
