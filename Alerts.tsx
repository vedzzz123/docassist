import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert as RNAlert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { supabase } from './App';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Alert {
  id: string;
  alert_type: 'prescription' | 'appointment';
  created_at: string;
  is_active: boolean;
  
  // Prescription fields
  alert_name?: string;
  alert_time?: string;
  days_of_week?: string[];
  time_of_day?: string;
  
  // Appointment fields
  doctor_name?: string;
  appointment_date?: string;
  appointment_time?: string;
}

const AlertsScreen = ({ navigation }: any) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'existing' | 'create'>('existing');

  // State for creating new alert
  const [alertName, setAlertName] = useState('');
  const [alertTime, setAlertTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState('Morning');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timesOfDay = ['Morning', 'Afternoon', 'Evening'];

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user logged in');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching alerts:', error);
        RNAlert.alert('Error', 'Failed to load alerts');
      } else {
        console.log('✅ Fetched alerts:', data?.length || 0);
        setAlerts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const formatTimeForStorage = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const formatTimeForDisplay = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setAlertTime(selectedDate);
    }
  };

  const saveAlert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        RNAlert.alert('Error', 'Please log in first');
        return;
      }

      if (!alertName || selectedDays.length === 0) {
        RNAlert.alert('Error', 'Please fill all fields');
        return;
      }

      const { error } = await supabase.from('alerts').insert({
        user_id: user.id,
        alert_type: 'prescription',
        alert_name: alertName,
        alert_time: formatTimeForStorage(alertTime),
        days_of_week: selectedDays,
        time_of_day: timeOfDay,
        is_active: true,
        notification_sent: false
      });

      if (error) {
        console.error('Error saving alert:', error);
        RNAlert.alert('Error', 'Failed to save alert');
        return;
      }

      RNAlert.alert('Success', 'Alert created successfully!');
      
      // Reset form
      setAlertName('');
      setSelectedDays([]);
      setTimeOfDay('Morning');
      setAlertTime(new Date());
      setSelectedTab('existing');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to save alert:', err);
      RNAlert.alert('Error', 'Something went wrong');
    }
  };

  const deleteAlert = async (alertId: string) => {
    RNAlert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('alerts')
              .update({ is_active: false })
              .eq('id', alertId);

            if (error) {
              RNAlert.alert('Error', 'Failed to delete alert');
            } else {
              fetchAlerts();
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    if (item.alert_type === 'prescription') {
      return (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>💊 Prescription</Text>
            <TouchableOpacity onPress={() => deleteAlert(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.alertTitle}>{item.alert_name}</Text>
          
          <View style={styles.alertDetails}>
            <Text style={styles.detailText}>⏰ {item.alert_time?.slice(0, 5)}</Text>
            <Text style={styles.detailText}>🕐 {item.time_of_day}</Text>
          </View>
          
          <View style={styles.daysContainer}>
            {item.days_of_week?.map((day: string, index: number) => (
              <View key={index} style={styles.dayBadge}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertType}>🩺 Appointment</Text>
            <TouchableOpacity onPress={() => deleteAlert(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.alertTitle}>{item.doctor_name}</Text>
          
          <View style={styles.alertDetails}>
            <Text style={styles.detailText}>
              📅 {item.appointment_date ? formatDate(item.appointment_date) : 'N/A'}
            </Text>
            <Text style={styles.detailText}>⏰ {item.appointment_time}</Text>
          </View>
        </View>
      );
    }
  };

  const renderCreateAlert = () => (
    <ScrollView style={styles.createContainer}>
      <Text style={styles.label}>Alert Name (e.g., Take Paracetamol)</Text>
      <TextInput
        style={styles.input}
        placeholder="Alert name (e.g. Take Paracetamol)"
        value={alertName}
        onChangeText={setAlertName}
      />

      <Text style={styles.label}>Time</Text>
      <TouchableOpacity 
        style={styles.timeDisplay} 
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={styles.timeText}>{formatTimeForDisplay(alertTime)}</Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={alertTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}

      <Text style={styles.label}>Select Days</Text>
      <View style={styles.daysSelector}>
        {daysOfWeek.map((day) => (
          <TouchableOpacity
            key={day}
            onPress={() => toggleDay(day)}
            style={[
              styles.dayButton,
              selectedDays.includes(day) && styles.dayButtonSelected
            ]}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDays.includes(day) && styles.dayButtonTextSelected
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Time of Day</Text>
      <View style={styles.timeOfDayContainer}>
        {timesOfDay.map((time) => (
          <TouchableOpacity
            key={time}
            onPress={() => setTimeOfDay(time)}
            style={[
              styles.timeOfDayButton,
              timeOfDay === time && styles.timeOfDayButtonSelected
            ]}
          >
            <Text
              style={[
                styles.timeOfDayText,
                timeOfDay === time && styles.timeOfDayTextSelected
              ]}
            >
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveAlert}>
        <Text style={styles.saveButtonText}>Save Alert</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057b3" />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'create' && styles.activeTab]}
          onPress={() => setSelectedTab('create')}
        >
          <Text style={[styles.tabText, selectedTab === 'create' && styles.activeTabText]}>
            Create New Alert
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'existing' && styles.activeTab]}
          onPress={() => setSelectedTab('existing')}
        >
          <Text style={[styles.tabText, selectedTab === 'existing' && styles.activeTabText]}>
            Existing Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'create' ? (
        renderCreateAlert()
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Alerts Yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0057b3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0057b3',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertType: {
    fontSize: 14,
    color: '#0057b3',
    fontWeight: 'bold',
  },
  deleteButton: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  alertDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  dayBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayText: {
    color: '#0057b3',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  createContainer: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  timeDisplay: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0057b3',
  },
  daysSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  dayButtonSelected: {
    backgroundColor: '#0057b3',
  },
  dayButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  timeOfDayContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  timeOfDayButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeOfDayButtonSelected: {
    backgroundColor: '#0057b3',
  },
  timeOfDayText: {
    color: '#666',
    fontWeight: '600',
  },
  timeOfDayTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#0057b3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AlertsScreen;
