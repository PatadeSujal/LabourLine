import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  calculateDistance,
  getUserCoordinates,
} from "../app/src/store/locationUtils";

const JobDetailModal = ({ visible, onClose, job, onAccept, onBid }) => {
  const { t } = useTranslation();
  const [distanceText, setDistanceText] = useState(t('jobCard.locating') || "Locating...");
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (visible && job) {
      const getDistance = async () => {
        try {
          const userCords = await getUserCoordinates();
          if (isMounted && userCords && job.latitude && job.longitude) {
            const dist = calculateDistance(
              userCords.latitude,
              userCords.longitude,
              job.latitude,
              job.longitude,
            );
            setDistanceText(`${dist} ${t('common.km') || "km"}`);
          } else if (isMounted) {
            setDistanceText(job.location ? job.location.split(",")[0] : t('jobCard.defaultLocation') || "Pune");
          }
        } catch (err) {
          if (isMounted) setDistanceText(t('jobCard.defaultLocation') || "Pune");
        }
      };
      getDistance();
    }
    return () => {
      isMounted = false;
    };
  }, [visible, job]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!job) return null;

  const isBidding = job.isBiddingAllowed;

  async function playSound() {
    const audioUrl = job.audioUrl;
    if (!audioUrl || audioUrl === "none") {
      Alert.alert(t('common.noAudio') || "No Audio", t('common.noVoiceDescription') || "No voice description.");
      return;
    }

    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      setIsPlaying(true);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await newSound.unloadAsync();
          setSound(null);
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPlaying(false);
      Alert.alert(t('common.error') || "Error", t('common.couldNotPlayAudio') || "Could not play audio.");
    }
  }

  const getDuration = () => {
    if (job.description?.includes("Duration:")) {
      return job.description.split(".")[0].replace("Duration: ", "") + " " + (t('common.hrs') || "Hrs");
    }
    return job.duration || t('jobCard.defaultDuration') || "8 Hrs";
  };

  const handleAction = () => {
    if (isBidding && onBid) {
      onBid(job);
    } else if (!isBidding && onAccept) {
      onAccept(job.id);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Header / Close Button */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>{t('common.jobDetails') || "Job Details"}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <Icon name="close" size={28} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Image Section */}
            <Image
              source={{ uri: job.image || "https://via.placeholder.com/400" }}
              style={styles.heroImage}
              resizeMode="cover"
            />

            {/* Title & Category */}
            <View style={styles.titleSection}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>{job.skillsRequired || job.category || t('common.general') || "General"}</Text>
              </View>
            </View>

            {/* Key Infos Row (Price, Location, Duration) */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Icon name="cash" size={24} color="#2ecc71" />
                <Text style={styles.infoLabel}>{isBidding ? t('jobCard.budget') || "Budget" : t('jobCard.earning') || "Earning"}</Text>
                <Text style={styles.infoVal}>₹ {job.budget || job.salary}</Text>
              </View>
              <View style={styles.infoCard}>
                <Icon name="map-marker-distance" size={24} color="#E65100" />
                <Text style={styles.infoLabel}>{t('common.distance') || "Distance"}</Text>
                <Text style={styles.infoVal}>{distanceText}</Text>
              </View>
              <View style={styles.infoCard}>
                <Icon name="clock-outline" size={24} color="#0D47A1" />
                <Text style={styles.infoLabel}>{t('common.duration') || "Duration"}</Text>
                <Text style={styles.infoVal}>{getDuration()}</Text>
              </View>
            </View>

            {/* Audio Section */}
            {job.audioUrl && job.audioUrl !== "none" && (
              <TouchableOpacity style={[styles.audioBlock, isPlaying && styles.audioPlaying]} onPress={playSound}>
                <View style={styles.audioRow}>
                  <Icon name={isPlaying ? "stop-circle-outline" : "volume-high"} size={28} color={isPlaying ? "#fff" : "#1B1464"} />
                  <Text style={[styles.audioText, isPlaying && { color: "#fff" }]}>
                    {isPlaying ? "Stop Audio" : "Play Voice Description"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Description Section */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>{t('employer.descriptionLabel') || "DESCRIPTION"}</Text>
              <Text style={styles.descriptionText}>{job.description}</Text>
            </View>
            
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t('common.close') || "Close"}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                isBidding ? styles.bidButton : styles.acceptButton
              ]} 
              onPress={handleAction}
            >
              <Text style={styles.actionButtonText}>
                {isBidding ? t('jobCard.bidNow') || "Bid Now" : t('jobCard.accept') || "Accept"}
              </Text>
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
    justifyContent: "flex-end", // Slide up from bottom
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    overflow: "hidden",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  closeIcon: {
    padding: 5,
  },
  heroImage: {
    width: "100%",
    height: 250,
    backgroundColor: "#eee",
  },
  titleSection: {
    padding: 20,
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: "heavy", // Very bold
    color: "#000",
    marginBottom: 10,
  },
  tagContainer: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  tagText: {
    color: "#E65100",
    fontSize: 14,
    fontWeight: "bold",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  audioBlock: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#E8EAF6",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C5CAE9",
  },
  audioPlaying: {
    backgroundColor: "#1B1464",
    borderColor: "#1B1464",
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  audioText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1B1464",
  },
  descriptionSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 18, // Large font size as requested
    lineHeight: 28,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    padding: 15,
    paddingBottom: 30, // Extra padding for safe area
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#EEE",
  },
  closeButton: {
    flex: 1,
    paddingVertical: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  actionButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#1B1464", // Standard Accept color
  },
  bidButton: {
    backgroundColor: "#8E24AA", // Bidding color
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default JobDetailModal;
