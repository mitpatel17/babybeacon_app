import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import API_URL from "../config";
import { Calendar } from "react-native-calendars";
import { useIsFocused } from "@react-navigation/native";
import Swiper from 'react-native-swiper';
import { BarChart, PieChart } from 'react-native-chart-kit';

const RideHistoryScreen = () => {
    const isFocused = useIsFocused();
    const today = new Date().toISOString().split("T")[0];
    const [rides, setRides] = useState([]);
    const [babyName, setBabyName] = useState("");
    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [rideDateMarkings, setRideDateMarkings] = useState({});
    const [ridesForSelectedDate, setRidesForSelectedDate] = useState([]);

    useEffect(() => {
        if (isFocused) {
          const todayDate = new Date().toISOString().split("T")[0];
          setSelectedDate(todayDate);
          fetchRideHistory(todayDate);
        }
      }, [isFocused]);

    const fetchRideHistory = async (initialSelectedDate = today) => {
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
                setRides(filteredRides);
                processRidesForCalendar(filteredRides, initialSelectedDate); // ✅ pass selected
                filterRidesByDate(initialSelectedDate, filteredRides);
              }
            }
          }
      
          setLoading(false);
        } catch (error) {
          console.error("Error fetching ride history:", error);
          setLoading(false);
        }
      };      

    const filterRidesByDate = (dateString, allRides) => {
        const sameDayRides = allRides.filter((ride) => {
          const rideDate = new Date(ride.start_time).toISOString().split("T")[0];
          return rideDate === dateString;
        });
        setRidesForSelectedDate(sameDayRides);
    };
      
    const applySelectedDateMarking = (baseMarkings, selected) => {
        const markings = {};
      
        // Start with ride-based styles
        Object.entries(baseMarkings).forEach(([date, style]) => {
          markings[date] = { ...style };
        });
      
        // Mark today (if it's not selected)
        if (today !== selected) {
          markings[today] = {
            customStyles: {
              container: {
                backgroundColor: "#339CFF", // Blue for today
                borderRadius: 6,
              },
              text: {
                color: "white",
                fontWeight: "bold",
              },
            },
          };
        }
      
        // Highlight the selected date in orange
        markings[selected] = {
          customStyles: {
            container: {
              backgroundColor: "#FFA500", // Orange
              borderRadius: 6,
            },
            text: {
              color: "white",
              fontWeight: "bold",
            },
          },
        };
      
        return markings;
    };      

    const processRidesForCalendar = (rides, selectedDateOverride = selectedDate) => {
        const dateCounts = {};
        rides.forEach((ride) => {
          const date = new Date(ride.start_time).toISOString().split("T")[0];
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
      
        const markings = {};
        Object.entries(dateCounts).forEach(([date, count]) => {
          let color = "transparent";
          if (count === 1) color = "#a8e6a3";
          else if (count === 2) color = "#66bb6a";
          else if (count >= 3) color = "#2e7d32";
      
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
      
        setRideDateMarkings(markings);
        setMarkedDates(applySelectedDateMarking(markings, selectedDateOverride));
    };      

    return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Rides History for {babyName}</Text>
      
          <Calendar
            markingType={"custom"}
            markedDates={markedDates}
            onDayPress={(day) => {
              const selected = day.dateString;
              setSelectedDate(selected);
              setMarkedDates(applySelectedDateMarking(rideDateMarkings, selected));
              filterRidesByDate(selected, rides);
            }}
            style={styles.calendar}
            theme={{ /* calendar theme styling */ }}
          />
      
        {ridesForSelectedDate.length === 0 ? (
            <Text style={styles.noRidesText}>No rides taken on {selectedDate}</Text>
            ) : (
            ridesForSelectedDate.map((ride, index) => {
                const start = new Date(ride.start_time);
                const end = new Date(ride.end_time);
                const duration = ((end - start) / (1000 * 60)).toFixed(1); // duration in minutes

                let pos = 0, neu = 0, neg = 0;
                Object.keys(ride).forEach((key) => {
                if (key.startsWith("scan")) {
                    const emotion = ride[key].emotion;
                    if (["Angry", "Disgust", "Fear", "Sad"].includes(emotion)) neg++;
                    else if (emotion === "Neutral") neu++;
                    else pos++;
                }
                });

                return (
                <View key={index} style={styles.rideCard}>
                    <Text style={styles.rideTitle}>Ride {ride.ride_id.match(/\d+/)?.[0]}</Text>
                    <Text style={styles.rideInfo}>Start: {start.toLocaleTimeString()}</Text>
                    <Text style={styles.rideInfo}>End: {end.toLocaleTimeString()}</Text>
                    <Text style={styles.rideInfo}>Duration: {duration} minutes</Text>

                    <Swiper
                        showsPagination={true}
                        loop={false}
                        height={250}
                        style={{ marginTop: 20 }}
                        dotStyle={{ marginHorizontal: 6 }}
                        >
                        {/* Slide 1: Pie Chart */}
                        <View style={{ alignItems: "center", paddingVertical: 10 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Mood Distribution</Text>
                            <PieChart
                            data={[
                                { name: "Positive", count: pos, color: "#4CAF50", legendFontColor: "#000", legendFontSize: 14 },
                                { name: "Neutral", count: neu, color: "#FFC107", legendFontColor: "#000", legendFontSize: 14 },
                                { name: "Negative", count: neg, color: "#F44336", legendFontColor: "#000", legendFontSize: 14 },
                            ]}
                            width={Dimensions.get("window").width - 60} // more margin
                            height={180}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            accessor={"count"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            absolute
                            />
                        </View>

                        {/* Slide 2: Negative Emotions Bar Chart */}
                        <View style={{ alignItems: "center", paddingVertical: 10 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Negative Emotions</Text>
                            <BarChart
                            data={{
                                labels: ["Angry", "Disgust", "Fear", "Sad"],
                                datasets: [
                                {
                                    data: [
                                    Object.values(ride).filter(s => s?.emotion === "Angry").length,
                                    Object.values(ride).filter(s => s?.emotion === "Disgust").length,
                                    Object.values(ride).filter(s => s?.emotion === "Fear").length,
                                    Object.values(ride).filter(s => s?.emotion === "Sad").length,
                                    ]
                                }
                                ]
                            }}
                            width={Dimensions.get("window").width - 75}
                            height={180}
                            fromZero
                            chartConfig={{
                                backgroundColor: "#fff",
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                decimalPlaces: 0,
                                barPercentage: 0.6,
                                color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            style={{ borderRadius: 10 }}
                            />
                        </View>

                        {/* Slide 3: Positive Emotions Bar Chart */}
                        <View style={{ alignItems: "center", paddingVertical: 10 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Positive Emotions</Text>
                            <BarChart
                            data={{
                                labels: ["Happy", "Surprise", "Calm", "Excited"],
                                datasets: [
                                {
                                    data: [
                                    Object.values(ride).filter(s => s?.emotion === "Happy").length,
                                    Object.values(ride).filter(s => s?.emotion === "Surprise").length,
                                    Object.values(ride).filter(s => s?.emotion === "Calm").length,
                                    Object.values(ride).filter(s => s?.emotion === "Excited").length,
                                    ]
                                }
                                ]
                            }}
                            width={Dimensions.get("window").width - 75}
                            height={180}
                            fromZero
                            chartConfig={{
                                backgroundColor: "#fff",
                                backgroundGradientFrom: "#fff",
                                backgroundGradientTo: "#fff",
                                decimalPlaces: 0,
                                barPercentage: 0.6,
                                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            style={{ borderRadius: 10 }}
                            />
                        </View>
                    </Swiper>

                </View>
                );
            })
        )}
        </ScrollView>
      );      
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 20,
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
    rideCard: {
        width: "100%",
        padding: 16,
        marginVertical: 10,
        backgroundColor: "#f0f0f0",
        borderRadius: 10,
        elevation: 2,
      },
      rideTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 6,
      },
      rideInfo: {
        fontSize: 14,
        marginBottom: 4,
      },     
      noRidesText: {
        marginTop: 20,
        fontSize: 16,
        color: "#666",
        fontStyle: "italic",
        textAlign: "center",
      }, 
});

export default RideHistoryScreen;
