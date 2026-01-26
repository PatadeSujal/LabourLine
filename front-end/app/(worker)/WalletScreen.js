import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const WalletScreen = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock transactions remain static for now until you have a Transaction table
  const transactions = [
    {
      id: "1",
      type: "payment",
      title: "Payment: Paver Block Fitting",
      date: "Today, 3:30 PM",
      points: "+ 20 Pts",
      amount: "+ ₹1000",
    },
    {
      id: "2",
      type: "canceled",
      title: "Canceled: Wall Painting",
      date: "Today, 3:30 PM",
      points: "- 10 Pts",
      amount: "₹1000",
    },
  ];

  const fetchWalletDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const decoded = jwtDecode(token);
      const userId = decoded.id;

      // Ensure this matches your Spring Boot machine's IP
      const API_URL = `http://10.62.29.175:8080/user/${userId}/labour-profile`;

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      } else {
        Alert.alert("Error", "Failed to sync wallet data");
      }
    } catch (error) {
      console.error("Wallet Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF9F43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>My Wallet</Text>

        {/* Balance Card - Mapping totalEarnings to Available Balance */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Available Balance</Text>
          <Text style={styles.cardBalance}>
            ₹ {walletData?.totalEarnings || "0"}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>Total Earned</Text>
            <Text style={styles.statValueGreen}>
              ₹ {walletData?.totalEarnings || "0"}
            </Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Total Points</Text>
            <Text style={styles.statValueGreen}>
              {(walletData?.rating * 100).toFixed(0) || "0"}
            </Text>
          </View>
        </View>

        {/* Recent Transactions Section */}
        <Text style={styles.sectionTitle}>Recent Transaction</Text>
        <View style={styles.transactionsList}>
          {transactions.map((item) => (
            <View key={item.id} style={styles.transactionItem}>
              <View style={styles.iconContainer}>
                {item.type === "payment" ? (
                  <Feather name="check-circle" size={28} color="#2ecc71" />
                ) : (
                  <Feather name="x-circle" size={28} color="#e74c3c" />
                )}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{item.title}</Text>
                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionDate}>{item.date}</Text>
                  <Text
                    style={[
                      styles.transactionPoints,
                      {
                        color: item.type === "payment" ? "#2ecc71" : "#e74c3c",
                      },
                    ]}
                  >
                    {item.points}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: item.type === "payment" ? "#2ecc71" : "#000" },
                ]}
              >
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  // Balance Card Styles
  card: {
    backgroundColor: "#FF9F43", // Orange color from the design
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#FF9F43",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  cardBalance: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cardPlaceholder: {
    backgroundColor: "#1B1464", // Dark placeholder color
    height: 40,
    width: "60%",
    borderRadius: 10,
  },
  // Stats Row Styles
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  statLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 5,
  },
  statValueGreen: {
    color: "#2ecc71",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Transaction Section Styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  transactionsList: {
    backgroundColor: "#fff",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  iconContainer: {
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
  },
  transactionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 10,
  },
  transactionDate: {
    color: "#888",
    fontSize: 12,
  },
  transactionPoints: {
    fontSize: 12,
    fontWeight: "600",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WalletScreen;
