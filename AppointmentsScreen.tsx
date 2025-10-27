import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { supabase } from './App';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Appointment {
  id: string;
  user_id: string;
  doctor_name: string;
  appointment_date: string;
  time_slot: string;
  cost: number;
  original_date?: string;
  original_time_slot?: string;
  is_rescheduled?: boolean;
  reschedule_count?: number;
  rescheduled_at?: string;
  patient_name?: string;
}

const AppointmentsScreen = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming' | 'history'>('today');
  
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  const timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00'];

  useEffect(() => {
    console.log('🟢 Component mounted, fetching appointments...');
    fetchAppointments();
  }, []);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const isToday = (dateString: string): boolean => {
    const today = formatDate(new Date());
    return dateString === today;
  };

  const isPast = (dateString: string): boolean => {
    const today = formatDate(new Date());
    return dateString < today;
  };

  // ✅ WITH DEBUGGING
  const fetchAppointments = async () => {
  try {
    console.log('📥 Starting fetch...');
    setLoading(true);

    // Step 1: Fetch appointments
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('time_slot', { ascending: true });

    console.log('📊 Appointments fetched:', appointments?.length || 0);

    if (aptError) {
      console.error('❌ Error fetching appointments:', aptError);
      Alert.alert('Error', 'Failed to load appointments: ' + aptError.message);
      return;
    }

    if (!appointments || appointments.length === 0) {
      console.log('⚠️ No appointments found');
      setTodayAppointments([]);
      setUpcomingAppointments([]);
      setPastAppointments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Step 2: Get unique user IDs
    const userIds = [...new Set(appointments.map(apt => apt.user_id))];
    console.log('👤 Looking for user IDs:', userIds);

    // Step 3: Fetch ALL user details without filter first to see what's available
    const { data: allUsers, error: allUserError } = await supabase
      .from('user_details')
      .select('*');

    console.log('👥 ALL users in database:', JSON.stringify(allUsers, null, 2));

    // Step 4: Now fetch the specific users we need
    const { data: users, error: userError } = await supabase
      .from('user_details')
      .select('user_id, name, surname')
      .in('user_id', userIds);

    console.log('👥 Matching users found:', users?.length || 0);
    console.log('👥 User details:', JSON.stringify(users, null, 2));

    if (userError) {
      console.error('❌ Error fetching users:', userError);
    }

    // Step 5: Merge data and show detailed matching
    const processedAppointments: Appointment[] = appointments.map((apt: any) => {
      const user = users?.find(u => u.user_id === apt.user_id);
      console.log(`🔍 Matching appointment ${apt.id} (user_id: ${apt.user_id}) with user:`, user ? `${user.name} ${user.surname}` : 'NOT FOUND');
      
      return {
        id: apt.id,
        user_id: apt.user_id,
        doctor_name: apt.doctor_name,
        appointment_date: apt.appointment_date,
        time_slot: apt.time_slot,
        cost: apt.cost,
        original_date: apt.original_date,
        original_time_slot: apt.original_time_slot,
        is_rescheduled: apt.is_rescheduled || false,
        reschedule_count: apt.reschedule_count || 0,
        rescheduled_at: apt.rescheduled_at,
        patient_name: user ? `${user.name} ${user.surname}` : 'Unknown Patient',
      };
    });

    const today_date = formatDate(new Date());
    const today = processedAppointments.filter(apt => isToday(apt.appointment_date));
    const upcoming = processedAppointments.filter(apt => 
      !isToday(apt.appointment_date) && !isPast(apt.appointment_date)
    );
    const history = processedAppointments.filter(apt => isPast(apt.appointment_date));

    console.log('📌 Final counts - Today:', today.length, 'Upcoming:', upcoming.length, 'History:', history.length);

    setTodayAppointments(today);
    setUpcomingAppointments(upcoming);
    setPastAppointments(history);

  } catch (error) {
    console.error('💥 Fetch error:', error);
    Alert.alert('Error', 'Something went wrong');
  } finally {
    console.log('✅ Fetch complete');
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewDate(new Date(appointment.appointment_date));
    setSelectedTimeSlot(appointment.time_slot);
    setShowRescheduleModal(true);
  };

  const saveReschedule = async () => {
    if (!selectedAppointment || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    try {
      const formattedDate = formatDate(newDate);
      const isFirstReschedule = !selectedAppointment.is_rescheduled;
      
      const updateData: any = {
        appointment_date: formattedDate,
        time_slot: selectedTimeSlot,
        is_rescheduled: true,
        rescheduled_at: new Date().toISOString(),
        reschedule_count: (selectedAppointment.reschedule_count || 0) + 1,
      };

      if (isFirstReschedule) {
        updateData.original_date = selectedAppointment.appointment_date;
        updateData.original_time_slot = selectedAppointment.time_slot;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', selectedAppointment.id);

      if (error) {
        console.error('Reschedule error:', error);
        Alert.alert('Error', 'Failed to reschedule appointment');
        return;
      }

      Alert.alert(
        'Success',
        'Appointment rescheduled successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRescheduleModal(false);
              fetchAppointments();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const quickRescheduleOptions = [
    { label: 'Tomorrow', days: 1 },
    { label: 'Day After', days: 2 },
    { label: 'Next Week', days: 7 },
    { label: 'Custom', days: null },
  ];

  const handleQuickReschedule = (days: number | null) => {
    if (days !== null) {
      const newDateValue = new Date();
      newDateValue.setDate(newDateValue.getDate() + days);
      setNewDate(newDateValue);
    } else {
      setShowDatePicker(true);
    }
  };

  const getCurrentData = () => {
    const data = selectedTab === 'today' ? todayAppointments :
                selectedTab === 'upcoming' ? upcomingAppointments :
                pastAppointments;
    console.log(`📋 Getting data for ${selectedTab}:`, data.length);
    return data;
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    console.log('🎨 Rendering card for:', item.patient_name);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.patientName}>{item.patient_name}</Text>
            {item.is_rescheduled && (
              <Text style={styles.rescheduledBadge}>
                🔄 Rescheduled {item.reschedule_count}x
              </Text>
            )}
          </View>
          <Text style={styles.cost}>₹{item.cost}</Text>
        </View>

        {item.is_rescheduled && item.original_date && (
          <View style={styles.originalDateContainer}>
            <Text style={styles.originalLabel}>Original:</Text>
            <Text style={styles.originalValue}>
              {formatDisplayDate(item.original_date)} at {item.original_time_slot}
            </Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>📅 Date:</Text>
            <Text style={styles.value}>{formatDisplayDate(item.appointment_date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>⏰ Time:</Text>
            <Text style={styles.value}>{item.time_slot}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>🩺 Doctor:</Text>
            <Text style={styles.value}>{item.doctor_name}</Text>
          </View>
        </View>

        {selectedTab !== 'history' && (
          <TouchableOpacity
            style={styles.rescheduleButton}
            onPress={() => openRescheduleModal(item)}
          >
            <Text style={styles.rescheduleText}>Reschedule Appointment</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057b3" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  console.log('🖥️ Rendering main screen, current tab:', selectedTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{todayAppointments.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{upcomingAppointments.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pastAppointments.length}</Text>
            <Text style={styles.statLabel}>History</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.activeTab]}
          onPress={() => {
            console.log('👆 Switched to Today tab');
            setSelectedTab('today');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.activeTabText]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => {
            console.log('👆 Switched to Upcoming tab');
            setSelectedTab('upcoming');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
          onPress={() => {
            console.log('👆 Switched to History tab');
            setSelectedTab('history');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCurrentData()}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedTab === 'today' && 'No appointments for today'}
              {selectedTab === 'upcoming' && 'No upcoming appointments'}
              {selectedTab === 'history' && 'No appointment history'}
            </Text>
          </View>
        }
      />

      <Modal
  visible={showRescheduleModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowRescheduleModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>Reschedule Appointment</Text>
        
        {selectedAppointment && (
          <View style={styles.currentAppointmentInfo}>
            <Text style={styles.modalSubtitle}>Current Appointment</Text>
            <Text style={styles.modalInfoText}>
              📅 {formatDisplayDate(selectedAppointment.appointment_date)}
            </Text>
            <Text style={styles.modalInfoText}>
              ⏰ {selectedAppointment.time_slot}
            </Text>
          </View>
        )}

        <Text style={styles.modalSubtitle}>Quick Reschedule</Text>
        <View style={styles.quickOptionsContainer}>
          {quickRescheduleOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickOptionButton}
              onPress={() => handleQuickReschedule(option.days)}
            >
              <Text style={styles.quickOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectedDateContainer}>
          <Text style={styles.modalSubtitle}>Selected Date</Text>
          <Text style={styles.selectedDateText}>
            {formatDisplayDate(formatDate(newDate))}
          </Text>
        </View>

        <Text style={styles.modalSubtitle}>Select Time Slot</Text>
        <View style={styles.timeSlotsContainer}>
          {timeSlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.timeSlotButton,
                selectedTimeSlot === slot && styles.selectedTimeSlot,
              ]}
              onPress={() => setSelectedTimeSlot(slot)}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  selectedTimeSlot === slot && styles.selectedTimeSlotText,
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.cancelModalButton}
            onPress={() => setShowRescheduleModal(false)}
          >
            <Text style={styles.cancelModalText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={saveReschedule}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>

  {showDatePicker && (
    <DateTimePicker
      value={newDate}
      mode="date"
      minimumDate={new Date()}
      onChange={(event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) setNewDate(date);
      }}
    />
  )}
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fa' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  header: { backgroundColor: '#0057b3', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 14, color: '#e0e0e0', marginTop: 5 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#0057b3' },
  tabText: { fontSize: 16, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#0057b3', fontWeight: 'bold' },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  patientName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  rescheduledBadge: { fontSize: 12, color: '#ff9800', marginTop: 4, fontWeight: '600' },
  cost: { fontSize: 20, fontWeight: 'bold', color: '#0057b3' },
  originalDateContainer: { backgroundColor: '#fff3cd', padding: 10, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  originalLabel: { fontSize: 13, color: '#856404', fontWeight: 'bold', marginRight: 8 },
  originalValue: { fontSize: 13, color: '#856404' },
  cardBody: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 15, color: '#666' },
  value: { fontSize: 15, fontWeight: '600', color: '#333' },
  rescheduleButton: { backgroundColor: '#0057b3', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  rescheduleText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  modalSubtitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  currentAppointmentInfo: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 10 },
  modalInfoText: { fontSize: 14, color: '#666', marginBottom: 4 },
  quickOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  quickOptionButton: { backgroundColor: '#e3f2fd', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  quickOptionText: { color: '#0057b3', fontWeight: '600', fontSize: 13 },
  selectedDateContainer: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginVertical: 10 },
  selectedDateText: { fontSize: 16, fontWeight: 'bold', color: '#0057b3', textAlign: 'center' },
  timeSlotsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap', // ✅ Changed from row to wrap
  marginBottom: 20,
  gap: 8, // ✅ Added gap for spacing
},
  timeSlotButton: { backgroundColor: '#f0f0f0', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginRight: 10 },
  selectedTimeSlot: { backgroundColor: '#0057b3' },
  timeSlotText: { color: '#666', fontSize: 14, fontWeight: '600' },
  selectedTimeSlotText: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelModalButton: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 15, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  cancelModalText: { color: '#666', fontWeight: 'bold', fontSize: 16 },
  saveButton: { flex: 1, backgroundColor: '#0057b3', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default AppointmentsScreen;
