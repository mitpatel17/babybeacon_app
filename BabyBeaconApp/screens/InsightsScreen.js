import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Dimensions } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";
import { BarChart } from "react-native-chart-kit";


const InsightsScreen = () => {
  const [babyName, setBabyName] = useState("");
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyCount, setDailyCount] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [longestRide, setLongestRide] = useState(0);
  const [shortestRide, setShortestRide] = useState(0);
  const [averageRide, setAverageRide] = useState(0);
  const [rideBuckets, setRideBuckets] = useState({
    under10: 0,
    between10and30: 0,
    between30and60: 0,
    between60and120: 0,
    over120: 0,
  });
  const [timeBuckets, setTimeBuckets] = useState({
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  });

  useEffect(() => {
    fetchProfileAndRides();
  }, []);

  const fetchProfileAndRides = async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) return;

      const profileRes = await axios.get(`${API_URL}/get_profile`, { params: { username } });

      if (profileRes.data.status === "success") {
        const { device_id, scanning_baby } = profileRes.data.data;
        setBabyName(scanning_baby);

        const babyDocRes = await axios.get(`${API_URL}/get_baby`, {
          params: { username, baby_name: scanning_baby },
        });

        if (babyDocRes.data.status === "success") {
          const babyRideIds = babyDocRes.data.data.rides || [];
          fetchAndFilterRides(device_id, babyRideIds);
        }
      }
    } catch (error) {
      console.error("Error fetching profile or baby data:", error);
      setLoading(false);
    }
  };

  const fetchAndFilterRides = async (deviceId, babyRideIds) => {
    try {
      const response = await axios.get(`${API_URL}/get_ride_insights`, {
        params: { device_id: deviceId },
      });

      if (response.data.status === "success") {
        const ridesData = response.data.rides || [];

        // Filter rides based on baby's ride IDs
        const filteredRides = ridesData.filter(ride =>
          babyRideIds.includes(ride.ride_id.replace("_", ""))
        );

        setRides(filteredRides);
        calculateRideStats(filteredRides);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching rides:", error);
      setLoading(false);
    }
  };

  const calculateRideStats = (ridesData) => {
    const now = new Date();
    let daily = 0, weekly = 0, monthly = 0;
    let totalDuration = 0;
    let maxDuration = 0;
    let minDuration = Number.MAX_SAFE_INTEGER;
    let buckets = { under10: 0, between10and30: 0, between30and60: 0, between60and120: 0, over120: 0 };

    ridesData.forEach((ride) => {
        const start = new Date(ride.start_time);
        const end = new Date(ride.end_time);
        const duration = (end - start) / (1000 * 60); // Duration in minutes

        // Update daily, weekly, monthly counts
        const diffTime = now - start;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays < 1) daily++;
        if (diffDays < 7) weekly++;
        if (start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()) monthly++;

        if (duration < 10) buckets.under10++;
        else if (duration < 30) buckets.between10and30++;
        else if (duration < 60) buckets.between30and60++;
        else if (duration < 120) buckets.between60and120++;
        else buckets.over120++;

        // Update longest/shortest durations
        if (duration > maxDuration) maxDuration = duration;
        if (duration < minDuration) minDuration = duration;
        totalDuration += duration;
    });
    
    setRideBuckets(buckets);
    setDailyCount(daily);
    setWeeklyCount(weekly);
    setMonthlyCount(monthly);
    setTotalCount(ridesData.length);
    setLongestRide(maxDuration.toFixed(1)); // in minutes
    setShortestRide(minDuration === Number.MAX_SAFE_INTEGER ? 0 : minDuration.toFixed(1));
    setAverageRide(ridesData.length ? (totalDuration / ridesData.length).toFixed(1) : 0);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{babyName ? `${babyName}'s Insights` : "Loading..."}</Text>

      {/* Ride Count Box */}
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Ride Counts</Text>
        <Text style={styles.statText}>Daily Rides: {dailyCount}</Text>
        <Text style={styles.statText}>Weekly Rides: {weeklyCount}</Text>
        <Text style={styles.statText}>Monthly Rides: {monthlyCount}</Text>
        <Text style={styles.statText}>All Time Rides: {totalCount}</Text>
      </View>

      {/* Ride Length Box */}
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Ride Durations</Text>
        <Text style={styles.statText}>Longest Ride: {longestRide} mins</Text>
        <Text style={styles.statText}>Shortest Ride: {shortestRide} mins</Text>
        <Text style={styles.statText}>Average Ride: {averageRide} mins</Text>
      </View>

      <View style={styles.chartBox}>
        <Text style={styles.statsTitle}>Ride Duration Distribution</Text>
        <BarChart
            data={{
            labels: ["<10m", "10-30m", "30-60m", "1-2h", "2h+"],
            datasets: [
                {
                data: [
                    rideBuckets.under10,
                    rideBuckets.between10and30,
                    rideBuckets.between30and60,
                    rideBuckets.between60and120,
                    rideBuckets.over120,
                ],
                },
            ],
            }}
            width={Dimensions.get("window").width - 40} // Responsive width
            height={220}
            chartConfig={{
            backgroundGradientFrom: "#f9f9f9",
            backgroundGradientTo: "#f9f9f9",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            barPercentage: 0.5,
            }}
            style={{
            marginVertical: 8,
            borderRadius: 16,
            }}
        />
      </View>
    </View>
  );

  return loading ? (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#007BFF" />
    </View>
  ) : (
    <FlatList
      contentContainerStyle={styles.container}
      ListHeaderComponent={renderHeader}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  statsBox: {
    width: "90%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  statText: {
    fontSize: 18,
    marginBottom: 10,
  },
  chartBox: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
});

export default InsightsScreen;
