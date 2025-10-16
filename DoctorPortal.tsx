import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DoctorPortal = ({ navigation }: any) => {
  const handleNavigation = (screen: string) => {
    // Add navigation logic here
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>👨‍⚕️ Welcome, Dr. Mehta</Text>
      <Text style={styles.subHeader}>Here's your dashboard</Text>

      <View style={styles.gridContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => handleNavigation('Appointments')}
          >
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={styles.gridCardTitle}>Show{'\n'}Appointments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => handleNavigation('LabResults')}
          >
            <Text style={styles.cardIcon}>🧪</Text>
            <Text style={styles.gridCardTitle}>Show Lab{'\n'}Results</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => handleNavigation('ManagePrescriptions')}
          >
            <Text style={styles.cardIcon}>💊</Text>
            <Text style={styles.gridCardTitle}>Manage{'\n'}Prescriptions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => handleNavigation('AIChatbot')}
          >
            <Text style={styles.cardIcon}>🤖</Text>
            <Text style={styles.gridCardTitle}>Enable AI{'\n'}Chatbot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DoctorPortal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f4f7",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subHeader: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  gridContainer: {
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    width: '47%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 15,
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: 'center',
    lineHeight: 20,
  },
});
