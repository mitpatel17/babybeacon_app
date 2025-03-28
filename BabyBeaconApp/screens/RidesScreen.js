import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_URL from "../config";
import { Calendar } from "react-native-calendars";

const RideHistoryScreen = () => {
  const [babyName, setBabyName] = useState("");
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRideHistory();
  }, []);

  const fetchRideHistory = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      const profileRes = await axios.get(`${API_URL}/get_profile`, { params: { username } });

      if (profileRes.data.status === "success") {
        const { device_id, scanning_baby } = profileRes.data.data;
        setBabyName(scanning_baby);

        const babyDocRes = await axios.get(`${API_URL}/get_baby`, {
          params: { username, baby_name: scanning_baby },
        });

        if (babyDocRes.data.status === "success") {
          const babyRideIds = babyDocRes.data.data.rides || [];
          const response = await axios.get(`${API_URL}/get_ride_insights`, {
            params: { device_id },
          });

          if (response.data.status === "success") {
            const ridesData = response.data.rides || [];
            const filteredRides = ridesData.filter(ride =>
              babyRideIds.includes(ride.ride_id.replace("_", ""))
            );
            processRidesForCalendar(filteredRides);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching ride history:", error);
      setLoading(false);
    }
  };

  const processRidesForCalendar = (rides) => {
    const dateCounts = {};

    rides.forEach((ride) => {
      const date = new Date(ride.start_time).toISOString().split("T")[0];
      if (dateCounts[date]) {
        dateCounts[date]++;
      } else {
        dateCounts[date] = 1;
      }
    });

    const markings = {};
    Object.entries(dateCounts).forEach(([date, count]) => {
      let color = "transparent";
      if (count === 1) color = "#a8e6a3"; // light green
      else if (count === 2) color = "#66bb6a"; // medium green
      else if (count >= 3) color = "#2e7d32"; // dark green

      markings[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
            borderRadius: 6,
          },
          text: {
            color: count === 0 ? "black" : "white",
          },
        },
      };
    });

    setMarkedDates(markings);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Rides History for {babyName}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <Calendar
          markingType={"custom"}
          markedDates={markedDates}
          style={styles.calendar}
          theme={{
            calendarBackground: "#fff",
            textSectionTitleColor: "#000",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontWeight: "bold",
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
    paddingBottom: 10,
  },
});

export default RideHistoryScreen;
