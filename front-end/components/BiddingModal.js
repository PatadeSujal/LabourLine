import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const BiddingModal = ({ visible, onClose, job, onSuccess }) => {
  const { t } = useTranslation();
  const [bidAmount, setBidAmount] = useState("");
  const [bidComment, setBidComment] = useState("");
  const [bidLoading, setBidLoading] = useState(false);

  // When job changes, reset the default bid amount
  React.useEffect(() => {
    if (job && job.budget) {
      setBidAmount(job.budget.toString());
    } else {
      setBidAmount("");
    }
  }, [job]);

  const submitBid = async () => {
    if (!job) return;

    if (!bidAmount) {
      Alert.alert(t("common.error"), t("labourer.pleaseEnterAmount"));
      return;
    }

    setBidLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const decoded = jwtDecode(token);
      const labourId = decoded.id;

      const payload = {
        workId: job.id,
        labourId: labourId,
        bidAmount: parseFloat(bidAmount),
        comment: bidComment,
      };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_FRONTEND_API_URL}/labour/bid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        Alert.alert(t("common.success"), t("labourer.bidSent"));
        setBidAmount("");
        setBidComment("");
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        const errText = await response.text();
        Alert.alert(
          t("common.error"),
          errText || t("labourer.failedToPlaceBid")
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), t("labourer.networkRequestFailed"));
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("labourer.placeYourBid")}</Text>
          <Text style={styles.modalSubtitle}>
            {t("labourer.budgetLabel", {
              amount: job?.budget || job?.earning || "N/A",
            })}
          </Text>

          <Text style={styles.label}>{t("labourer.yourOffer")}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder={t("labourer.offerPlaceholder")}
            placeholderTextColor="#999"
            value={bidAmount}
            onChangeText={setBidAmount}
          />

          <Text style={styles.label}>{t("labourer.commentOptional")}</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
            multiline
            placeholder={t("labourer.commentPlaceholder")}
            placeholderTextColor="#999"
            value={bidComment}
            onChangeText={setBidComment}
          />

          <Text style={styles.warningNote}>
            {t("labourer.oneJobLimitNote") || "Note: You won't be able to accept other jobs until you complete this job if your bid is accepted."}
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onClose}
            >
              <Text style={styles.btnTextCancel}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnSubmit]}
              onPress={submitBid}
              disabled={bidLoading}
            >
              {bidLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnTextSubmit}>{t("labourer.sendBid")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  warningNote: {
    color: "#D32F2F", // Red color for the warning
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "500",
    fontStyle: "italic",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  btnCancel: {
    backgroundColor: "#eee",
  },
  btnSubmit: {
    backgroundColor: "#FF9F43",
  },
  btnTextCancel: {
    color: "#333",
    fontWeight: "bold",
  },
  btnTextSubmit: {
    color: "white",
    fontWeight: "bold",
  },
});

export default BiddingModal;
