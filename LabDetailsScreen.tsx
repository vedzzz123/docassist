import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// ✅ include navigation in props
const LabDetailsScreen = ({ route, navigation }: any) => {
  const { lab } = route.params; // lab = { name, price }
  const [agreed, setAgreed] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{lab.name}</Text>
      <Text style={styles.price}>Price: ₹{lab.price}</Text>

      <Text style={styles.sectionTitle}>Guidelines:</Text>
      <Text style={styles.guideline}>
        • Fast for 9–12 hours before the test, drinking only water.
      </Text>
      <Text style={styles.guideline}>
        • Avoid alcohol and fatty foods for at least 24 hours prior.
      </Text>
      <Text style={styles.guideline}>
        • Inform your doctor about medications that may affect results.
      </Text>

      {/* Terms & Conditions */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAgreed(!agreed)}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]} />
        <Text style={styles.checkboxText}>
          I agree to the terms and conditions
        </Text>
      </TouchableOpacity>

      {/* Slots */}
      <Text style={styles.sectionTitle}>Available Time Slots:</Text>
      <View style={styles.slotContainer}>
        {timeSlots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.slot,
              selectedSlot === slot && styles.selectedSlot,
              !agreed && styles.disabledSlot,
            ]}
            disabled={!agreed}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text
              style={[
                styles.slotText,
                selectedSlot === slot && styles.selectedSlotText,
                !agreed && styles.disabledSlotText,
              ]}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Confirm */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          !agreed && styles.disabledConfirmButton, // 🔹 greyed out
        ]}
        onPress={() => navigation.navigate('AppointmentReceipt')}
        disabled={!agreed} // 🔹 disables button
      >
        <Text style={styles.confirmText}>CONFIRM</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#0057b3',
  },
  price: {
    fontSize: 16,
    marginBottom: 15,
    color: '#444',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  guideline: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0057b3',
    marginRight: 10,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#0057b3',
  },
  checkboxText: {
    fontSize: 14,
    color: '#333',
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    borderWidth: 1,
    borderColor: '#0057b3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  slotText: {
    color: '#0057b3',
    fontWeight: '600',
  },
  selectedSlot: {
    backgroundColor: '#0057b3',
  },
  selectedSlotText: {
    color: '#fff',
  },
  disabledSlot: {
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
  },
  disabledSlotText: {
    color: '#aaa',
  },
  confirmButton: {
    backgroundColor: '#0057b3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledConfirmButton: {
    backgroundColor: '#ccc',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LabDetailsScreen;
