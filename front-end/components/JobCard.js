import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const JobCard = ({ job, onAccept, mainText }) => {
  // Logic to parse duration from description if present
  const getDuration = () => {
    if (job.description?.includes("Duration:")) {
      return job.description.split(".")[0].replace("Duration: ", "") + " Hrs";
    }
    // Fallback if the duration prop was passed directly from the screen mapper
    return job.duration || "8 Hrs";
  };

  return (
    <View style={styles.card}>
      {/* Header: Category and Status/Time */}
      <View style={styles.cardHeader}>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>
            {job.skillsRequired || job.category || "General"}
          </Text>
        </View>
        <Text style={styles.timeText}>{job.postedTime || "Active"}</Text>
      </View>

      <View style={styles.contentRow}>
        {/* Left: Job Image & Location Badge */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: job.image || "https://via.placeholder.com/150" }}
            style={styles.jobImage}
            resizeMode="cover"
          />
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText} numberOfLines={1}>
              {/* Handles "Pune, Maharashtra" -> "Pune" */}
              {job.location
                ? job.location.split(",")[0]
                : job.distance || "Pune"}
            </Text>
          </View>
        </View>

        {/* Right: Job Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {job.description}
          </Text>

          {/* Info Row: Duration & Audio */}
          <View style={styles.infoRow}>
            <View style={styles.durationBadge}>
              <Icon name="clock-outline" size={14} color="#555" />
              <Text style={styles.durationText}>{getDuration()}</Text>
            </View>
            <TouchableOpacity style={styles.audioButton}>
              <Icon name="volume-high" size={18} color="#1B1464" />
            </TouchableOpacity>
          </View>

          {/* Footer: Earning & Action */}
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.earningLabel}>Earning</Text>
              <Text style={styles.earningValue}>
                ₹ {job.earning || job.salary}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                mainText === "Status" && styles.statusButton, // Style change for Employer view
              ]}
              onPress={() => onAccept(job.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptText}>{mainText || "Accept"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tagContainer: {
    backgroundColor: "#FFE0B2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { color: "#E65100", fontSize: 11, fontWeight: "bold" },
  timeText: { color: "#999", fontSize: 11 },
  contentRow: { flexDirection: "row" },
  imageContainer: { position: "relative", marginRight: 12 },
  jobImage: {
    width: 95,
    height: 95,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  distanceBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: "center",
  },
  distanceText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  detailsContainer: { flex: 1, justifyContent: "space-between" },
  title: { fontSize: 16, fontWeight: "bold", color: "#000" },
  description: { fontSize: 13, color: "#666", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  durationText: { fontSize: 12, color: "#555", marginLeft: 4 },
  audioButton: { padding: 2 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  earningLabel: { fontSize: 10, color: "#888" },
  earningValue: { fontSize: 18, fontWeight: "bold", color: "#2ecc71" }, // Green for money
  acceptButton: {
    backgroundColor: "#1B1464",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  statusButton: {
    backgroundColor: "#FF9F43", // Distinct color for "You Posted" screen
  },
  acceptText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
});

export default JobCard;
