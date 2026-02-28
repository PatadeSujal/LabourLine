import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { acceptWorkApi, confirmBidApi } from "../store/workService";

const ViewBidsScreen = () => {
  const { t } = useTranslation();
  const { workId } = useLocalSearchParams(); // Get Work ID from navigation
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/employer/bids/${workId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setBids(data);
    } catch (error) {
      Alert.alert(t('common.error'), t('employer.failedToLoadBids'));
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Now accepts labourId
  // UPDATED: Now accepts userId
  const handleConfirmBid = async (bidId, amount) => {
    console.log("Called ");
    Alert.alert(
      t('employer.confirmWorker'),
      t('employer.confirmWorkerMessage', { amount }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('employer.hire'),
          onPress: async () => {
            setLoading(true);
            try {
              // 1. CALL THE NEW ROUTE VIA SERVICE
              console.log("Confirming bid ID:", bidId);
              const confirmedBidData = await confirmBidApi(bidId);

              // 2. EXTRACT THE LABOUR ID FROM THE RESPONSE
              const extractedLabourId = confirmedBidData.labourId;
              console.log("Extracted labour ID:", extractedLabourId);

              // 3. PASS IT TO YOUR NEXT API (If acceptWorkApi handles the 'work_accept' logic)
              const updatedWorkData = await acceptWorkApi(
                workId,
                extractedLabourId,
              );

              // 4. SUCCESS NAVIGATION
              Alert.alert(t('common.success'), t('employer.workerHired'));
              router.replace({
                pathname: "/src/screens/EmployerWorkStatusScreen",
                params: {
                  workData: JSON.stringify(updatedWorkData),
                },
              });
            } catch (error) {
              Alert.alert(t('common.error'), error.message || t('employer.failedToHire'));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderBidItem = ({ item }) => {
    // --- DEBUG LOG ---
    console.log("Bid Item Data:", item);

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.workerName}>
              {item.workerName || t('employer.unknownWorker')}
            </Text>
            <Text style={styles.comment}>"{item.comment || t('employer.noComment')}"</Text>
          </View>
          <Text style={styles.price}>₹{item.bidAmount}</Text>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          // UPDATED: Pass item.workerId instead of item.labourId
          onPress={() => handleConfirmBid(item.id, item.bidAmount)}
        >
          <Text style={styles.btnText}>{t('employer.confirmJob')}</Text>
          <MaterialIcons
            name="check-circle"
            size={20}
            color="white"
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 10 }}>
          <MaterialIcons name="arrow-back" size={24} color="#0D47A1" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('employer.receivedBids')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D47A1"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t('employer.noBidsYet')}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#0D47A1", marginLeft: 10 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  workerName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  comment: { fontSize: 14, color: "#666", fontStyle: "italic", marginTop: 4 },
  price: { fontSize: 22, fontWeight: "bold", color: "#2e7d32" },
  acceptButton: {
    backgroundColor: "#0D47A1",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#888",
    fontSize: 16,
  },
});

export default ViewBidsScreen;
