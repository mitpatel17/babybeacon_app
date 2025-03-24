import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Dimensions, Modal, TouchableOpacity } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";


const InsightsScreen = () => {
  const [babyName, setBabyName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailyCount, setDailyCount] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [longestRide, setLongestRide] = useState(0);
  const [shortestRide, setShortestRide] = useState(0);
  const [averageRide, setAverageRide] = useState(0);
  const isFocused = useIsFocused();
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
  const NEGATIVE_EMOTIONS = ["Angry", "Disgust", "Fear", "Sad"];
  const [emotionCounts, setEmotionCounts] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [negativeEmotionBuckets, setNegativeEmotionBuckets] = useState({
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  });
  const [negativeScanLengthBuckets, setNegativeScanLengthBuckets] = useState({
    under10: 0,
    between10and30: 0,
    between30and60: 0,
    between60and120: 0,
    over120: 0,
  });

  useEffect(() => {
    if (isFocused) {
      fetchProfileAndRides();
    }
  }, [isFocused]);

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
    let bucketsTime = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let negativeEmotionBuckets = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
    };
    let negativeBuckets = { under10: 0, between10and30: 0, between30and60: 0, between60and120: 0, over120: 0 };

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

        // Categorize ride length
        let bucketKey = "";
        if (duration < 10) bucketKey = "under10";
        else if (duration < 30) bucketKey = "between10and30";
        else if (duration < 60) bucketKey = "between30and60";
        else if (duration < 120) bucketKey = "between60and120";
        else bucketKey = "over120";

        buckets[bucketKey]++;

        // Determine time period
        const hour = start.getHours();
        let timePeriod = "";
        if (hour >= 5 && hour < 12) timePeriod = "morning";
        else if (hour >= 12 && hour < 17) timePeriod = "afternoon";
        else if (hour >= 17 && hour < 21) timePeriod = "evening";
        else timePeriod = "night";

        // Increment time period bucket count (for number of rides)
        bucketsTime[timePeriod]++;

        // Update longest/shortest durations
        if (duration > maxDuration) maxDuration = duration;
        if (duration < minDuration) minDuration = duration;
        totalDuration += duration;

        Object.keys(ride).forEach((key) => {
            if (key.startsWith("scan")) {
              const scan = ride[key]; // This is the scan object
              const emotion = scan.emotion;
              if (NEGATIVE_EMOTIONS.includes(emotion)) {
                negativeCount++;
              } else if (emotion === "Neutral") {
                neutralCount++;
              } else {
                positiveCount++;
              }
              if (scan && NEGATIVE_EMOTIONS.includes(scan.emotion)) {
                negativeEmotionBuckets[timePeriod]++;
              }
              if (NEGATIVE_EMOTIONS.includes(scan.emotion)) {
                negativeBuckets[bucketKey]++;
              }
            }
        });
    });
    
    setEmotionCounts({
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
    });
    setNegativeScanLengthBuckets(negativeBuckets);
    setTimeBuckets(bucketsTime);
    setRideBuckets(buckets);
    setDailyCount(daily);
    setWeeklyCount(weekly);
    setMonthlyCount(monthly);
    setTotalCount(ridesData.length);
    setLongestRide(maxDuration.toFixed(1)); // in minutes
    setShortestRide(minDuration === Number.MAX_SAFE_INTEGER ? 0 : minDuration.toFixed(1));
    setAverageRide(ridesData.length ? (totalDuration / ridesData.length).toFixed(1) : 0);
    setNegativeEmotionBuckets(negativeEmotionBuckets);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
            <Text style={styles.title}>{babyName}'s Insights</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoIcon}>
                <Ionicons name="information-circle-outline" size={32} color="#4CAF50" />
            </TouchableOpacity>
        </View>

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
                width={Dimensions.get("window").width - 40}
                height={220}
                chartConfig={{
                backgroundGradientFrom: "#f9f9f9",
                backgroundGradientTo: "#f9f9f9",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
                }}
                style={{
                marginVertical: 8,
                borderRadius: 16,
                }}
            />
        </View>
        <View style={styles.chartBox}>
            <Text style={styles.statsTitle}>Ride Times Distribution</Text>
            <PieChart
                data={[
                    { name: "Morning", population: timeBuckets.morning, color: "#FFA500", legendFontColor: "#333", legendFontSize: 14 },
                    { name: "Afternoon", population: timeBuckets.afternoon, color: "#00BFFF", legendFontColor: "#333", legendFontSize: 14 },
                    { name: "Evening", population: timeBuckets.evening, color: "#FF69B4", legendFontColor: "#333", legendFontSize: 14 },
                    { name: "Night", population: timeBuckets.night, color: "#9370DB", legendFontColor: "#333", legendFontSize: 14 },
                ]}
                width={Dimensions.get("window").width - 40}
                height={220}
                chartConfig={{
                    color: () => `#000`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
            />
        </View>
        <View style={styles.chartBox}>
            <Text style={styles.statsTitle}>Mood Distribution Signals (All Rides)</Text>
            <PieChart
                data={[
                { name: "Positive", count: emotionCounts.positive, color: "#4CAF50", legendFontColor: "#000", legendFontSize: 14 },
                { name: "Neutral", count: emotionCounts.neutral, color: "#FFD700", legendFontColor: "#000", legendFontSize: 14 },
                { name: "Negative", count: emotionCounts.negative, color: "#FF4C4C", legendFontColor: "#000", legendFontSize: 14 },
                ]}
                width={Dimensions.get("window").width - 40}
                height={220}
                chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"count"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
            />
        </View>
        <View style={styles.chartBox}>
            <Text style={styles.statsTitle}>Negative Scans by Time of Day</Text>
            <LineChart
                data={{
                labels: ["Morning", "Afternoon", "Evening", "Night"],
                datasets: [
                    {
                    data: [
                        negativeEmotionBuckets.morning,
                        negativeEmotionBuckets.afternoon,
                        negativeEmotionBuckets.evening,
                        negativeEmotionBuckets.night,
                    ],
                    },
                ],
                }}
                width={Dimensions.get("window").width - 40}
                height={220}
                yAxisLabel=""
                chartConfig={{
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 76, 76, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                    borderRadius: 16,
                },
                }}
                bezier
                style={{
                marginVertical: 8,
                borderRadius: 16,
                }}
            />
        </View>
        <View style={styles.chartBox}>
            <Text style={styles.statsTitle}>Negative Signals vs Ride Length</Text>
            <LineChart
                data={{
                labels: ["<10m", "10-30m", "30-60m", "1-2h", "2h+"],
                datasets: [
                    {
                    data: [
                        negativeScanLengthBuckets.under10,
                        negativeScanLengthBuckets.between10and30,
                        negativeScanLengthBuckets.between30and60,
                        negativeScanLengthBuckets.between60and120,
                        negativeScanLengthBuckets.over120,
                    ],
                    },
                ],
                }}
                width={Dimensions.get("window").width - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                backgroundColor: "#f9f9f9",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 76, 76, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#FF4C4C" },
                }}
                style={{ marginVertical: 8, borderRadius: 16 }}
            />
        </View>
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Graph Explanations</Text>
                
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Ride Counts:</Text> Shows the number of rides taken daily, weekly, monthly, and overall.
                </Text>
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Ride Durations:</Text> Displays the longest, shortest, and average ride lengths.
                </Text>
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Ride Duration Distribution:</Text> Bar chart showing how many rides fall within time ranges like under 10 mins, 10-30 mins, etc.
                </Text>
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Ride Times of Day:</Text> Pie chart showing the percentage of rides taken in the morning, afternoon, evening, and night.
                </Text>
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Mood Distribution:</Text> Pie chart summarizing how many positive, neutral, or negative moods were detected during rides.
                </Text>
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Negative Scans by Time of Day:</Text> Line graph showing how many negative emotions were detected during rides, categorized by time period.
                </Text>
                <Text style={styles.modalText}>
                    <Text style={{ fontWeight: "bold" }}>Negative Signals by Ride Length:</Text> Line graph showing how ride length affects the number of negative emotions detected.
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
                </TouchableOpacity>
                </View>
            </View>
        </Modal>
    </View>
  );

  return loading ? (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsBox: {
    width: "90%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "flex-start",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 15,
    alignSelf: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },  
  infoIcon: {
    marginLeft: 10,
    alignSelf: "center",
  },
});

export default InsightsScreen;
