import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const LabTests: React.FC = () => {
  const navigation = useNavigation<any>();

  const labTests = [
    { name: "Complete Blood Count (CBC)", price: 500 },
    { name: "Basic Metabolic Panel (BMP)", price: 400 },
    { name: "Lipid Panel", price: 600 },
    { name: "Liver Function Tests (LFTs)", price: 450 },
    { name: "Thyroid Stimulating Hormone (TSH)", price: 300 },
    { name: "Hemoglobin A1c (HbA1c)", price: 350 },
    { name: "Urinalysis", price: 200 },
    { name: "C-Reactive Protein (CRP)", price: 250 },
    { name: "Vitamin D Test", price: 700 },
    { name: "Kidney Function Test (KFT)", price: 550 },
    { name: "Electrolyte Panel", price: 480 },
    { name: "Iron Studies", price: 500 },
    { name: "Calcium Test", price: 320 },
  ];

  return (
    <View style={styles.container}>
      {/* Scrollable Lab List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {labTests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate("LabDetailsScreen", { lab: test })}
          >
            <Text style={styles.testName}>{test.name}</Text>
            <Text style={styles.price}>Price: ₹ {test.price}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fa",
  },
  scrollContent: {
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },
  testName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: "#555",
  },
});

export default LabTests;
