import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const CategoryFilterModal = ({ visible, onClose, categories, onSelect, title }) => {
  const { t } = useTranslation();
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* FIXED: Changed <div> to <View> */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title || t('modal.selectCategory')}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false} // Clean UI
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryItem}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(item.label);
                  //   onClose;
                }}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: item.color || "#0D47A1" },
                  ]}
                />
                <Text style={styles.categoryItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end", // Slides up from bottom
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%", // Increased slightly for better list visibility
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B1464",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18, // Slightly more padding for easier tapping
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 15,
  },
  categoryItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
});

export default CategoryFilterModal;
