import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

// TypeScript interfaces
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  fee: number;
  timeSlots: string[];
}

interface AppointmentData {
  doctor_name: string;
  appointment_date: string;
  time_slot: string;
  cost: number;
  payment_mode: string;
  appointment_status: string;
  doctorSpecialization: string;
  appointmentDateDisplay: string;
  doctorId: string;
}

interface NavigationProp {
  navigate: (route: string, params?: any) => void;
  goBack: () => void;
}

interface SelectDoctorProps {
  navigation: NavigationProp;
}

const SelectDoctor: React.FC<SelectDoctorProps> = ({ navigation }) => {
  const [selectedDoctor, setSelectedDoctor] = React.useState<string | null>(null);
  const [selectedDoctorData, setSelectedDoctorData] = React.useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = React.useState<boolean>(false);
  const [activeDoctorDatePicker, setActiveDoctorDatePicker] = React.useState<string | null>(null);

  const doctors: Doctor[] = [
    {
      id: 'dr_arvind',
      name: 'Dr. Arvind Mehta',
      specialization: 'General Physician',
      rating: 4.0,
      fee: 1,
      timeSlots: ['10:00', '11:00', '12:00', '13:00', '14:00']
    },
    {
      id: 'dr_urvi',
      name: 'Dr. Urvi A. Mehta',
      specialization: 'Cardiologist', 
      rating: 5.0,
      fee: 1,
      timeSlots: ['10:00', '11:00', '12:00', '13:00', '14:00']
    }
  ];

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatDateForStorage = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleSelectDoctor = (doctor: Doctor): void => {
    setSelectedDoctor(doctor.name);
    setSelectedDoctorData(doctor);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  };

  const showDatePicker = (doctorId: string): void => {
    setActiveDoctorDatePicker(doctorId);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = (): void => {
    setDatePickerVisibility(false);
    setActiveDoctorDatePicker(null);
  };

  const handleConfirmDate = (date: Date): void => {
    if (activeDoctorDatePicker === selectedDoctorData?.id) {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
    }
    hideDatePicker();
  };

  const handleSelectTimeSlot = (timeSlot: string): void => {
    setSelectedTimeSlot(timeSlot);
  };

  const handleBookAppointment = (): void => {
    if (!selectedDoctor || !selectedDoctorData || !selectedDate || !selectedTimeSlot) {
      Alert.alert(
        'Incomplete Selection', 
        'Please select doctor, date, and time slot to continue',
        [{ text: 'OK' }]
      );
      return;
    }

    const appointmentData: AppointmentData = {
      doctor_name: selectedDoctorData.name,
      appointment_date: formatDateForStorage(selectedDate),
      time_slot: selectedTimeSlot,
      cost: selectedDoctorData.fee,
      payment_mode: 'Razorpay',
      appointment_status: 'confirmed',
      doctorSpecialization: selectedDoctorData.specialization,
      appointmentDateDisplay: formatDate(selectedDate),
      doctorId: selectedDoctorData.id
    };

    navigation.navigate('AppointmentReceipt', {
      appointmentData
    });
  };

  // Fixed line 133 - properly typed return type
  const renderDoctor = (doctor: Doctor): React.JSX.Element => {
    const isSelected: boolean = selectedDoctor === doctor.name;
    const hasSelectedDate: boolean = isSelected && selectedDate !== null;
    
    return (
      <View key={doctor.id} style={[styles.doctorCard, isSelected && styles.selectedDoctorCard]}>
        <TouchableOpacity onPress={() => handleSelectDoctor(doctor)} style={styles.doctorHeader}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(Math.floor(doctor.rating))].map((_, i) => (
              <Text key={i} style={styles.star}>⭐</Text>
            ))}
          </View>
        </TouchableOpacity>

        <Text style={styles.specialization}>{doctor.specialization}</Text>
        <Text style={styles.fee}>₹{doctor.fee}</Text>

        <TouchableOpacity 
          style={[
            styles.dateButton, 
            hasSelectedDate && styles.selectedDateButton
          ]} 
          onPress={() => showDatePicker(doctor.id)}
          disabled={!isSelected}
        >
          <Text style={[
            styles.dateButtonText,
            hasSelectedDate && styles.selectedDateButtonText
          ]}>
            {isSelected && hasSelectedDate && selectedDate
              ? formatDate(selectedDate)
              : 'Select Date For Appointment'
            }
          </Text>
        </TouchableOpacity>

        {isSelected && hasSelectedDate && (
          <View style={styles.timeSlotsContainer}>
            {doctor.timeSlots.map((slot: string) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlot,
                  selectedTimeSlot === slot && styles.selectedTimeSlot
                ]}
                onPress={() => handleSelectTimeSlot(slot)}
              >
                <Text style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot && styles.selectedTimeSlotText
                ]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}></Text>
      </View>

      <Text style={styles.title}>Select Doctor</Text>

      <ScrollView style={styles.scrollContainer}>
        {doctors.map(renderDoctor)}
      </ScrollView>

      {selectedDoctor && selectedDate && selectedTimeSlot && (
        <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        minimumDate={new Date()}
        maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginVertical: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDoctorCard: {
    borderColor: '#1976D2',
    backgroundColor: '#f8f9ff',
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
  },
  specialization: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedDateButton: {
    backgroundColor: '#4CAF50',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedDateButtonText: {
    color: '#fff',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#FF9800',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  bookButton: {
    backgroundColor: '#1976D2',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SelectDoctor;
