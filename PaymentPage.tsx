import React from "react";

// @ts-ignore: no types for react-native-razorpay
import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from "./App";
import { Alert } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

// UPDATED: Add appointmentId parameter to link alert with appointment
const createAppointmentAlert = async (
  doctorName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentId: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user logged in');
      return;
    }

    const { error } = await supabase.from('alerts').insert({
      user_id: user.id,
      alert_type: 'appointment',
      doctor_name: doctorName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      appointment_id: appointmentId,
      is_active: true,
      notification_sent: false
    });

    if (error) {
      console.error('Error creating alert:', error);
    } else {
      console.log('✅ Appointment alert created successfully');
    }
  } catch (err) {
    console.error('Failed to create alert:', err);
  }
};

const PaymentPage = ({ navigation, route }: { navigation: any; route?: any }) => {
  const handlePayNow = async () => {
    // DEBUG: Check if doctor/date/time/appointmentId are passed
    console.log('PAYMENT DEBUG:', {
      doctor: route?.params?.doctor,
      date: route?.params?.date,
      time: route?.params?.time,
      appointmentId: route?.params?.appointmentId
    });

    try {
      // ✅ UPDATED: Get appointmentId from route params instead of hardcoded value
      const appointmentId = route?.params?.appointmentId || route?.params?.appointment_id;
      
      if (!appointmentId) {
        Alert.alert('Error', 'Appointment ID missing. Please try booking again.');
        return;
      }

      const amountRupees = 600;
      const amountPaise = Math.round(amountRupees * 100);

      // 1) Create order via Edge Function
      const { data: orderData, error: orderErr } = await supabase.functions.invoke('create-order', {
        body: { amountInPaise: amountPaise, appointmentId },
      });

      if (orderErr || !orderData?.orderId) {
        Alert.alert('Order error', orderErr?.message || 'Failed to create order');
        return;
      }

      // 2) Open Razorpay's default checkout UI
      const options: any = {
        key: orderData.keyId,
        order_id: orderData.orderId,
        amount: String(orderData.amount), // paise
        currency: orderData.currency, // "INR"
        name: 'DocAssist',
        description: `Appointment #${appointmentId}`,
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: { color: '#0057b3' },
        retry: { enabled: true, max_count: 1 },
      };

      const res = await RazorpayCheckout.open(options);
      // res contains: razorpay_payment_id, razorpay_order_id, razorpay_signature

      // 3) Verify payment signature on server
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
        body: {
          razorpay_order_id: res.razorpay_order_id,
          razorpay_payment_id: res.razorpay_payment_id,
          razorpay_signature: res.razorpay_signature,
          appointmentId,
        },
      });

      if (verifyErr || !verifyData?.valid) {
        Alert.alert('Verification failed', verifyErr?.message || 'Please contact support.');
        return;
      }

      // ✅ UPDATED: Create alert after successful payment verification with appointmentId
      const doctor = route?.params?.doctor;
      const date = route?.params?.date;
      const time = route?.params?.time;
      
      console.log('Creating alert with:', { doctor, date, time, appointmentId });
      
      if (doctor && date && time) {
        await createAppointmentAlert(
          doctor?.name || 'Unknown Doctor',
          date,
          time,
          appointmentId // ✅ Now using real appointmentId from route params
        );
      } else {
        console.warn('Cannot create alert - missing doctor/date/time in route params');
      }

      // 4) Success
      Alert.alert('Payment successful', 'Your appointment has been confirmed!');
      navigation.navigate("Home");

    } catch (e: any) {
      if (e?.code === 'RN_RAZORPAY_CANCELLED') {
        Alert.alert('Payment cancelled');
      } else {
        Alert.alert('Payment error', e?.message || 'Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Payment Options</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Preferred Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Payment Methods</Text>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>🏦</Text>
            <Text style={styles.cardText}>Netbanking - Bank of Baroda</Text>
          </View>
        </View>

        {/* Other Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards, Netbanking & More</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardText}>Card</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>🏛️</Text>
            <Text style={styles.cardText}>Netbanking</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>👛</Text>
            <Text style={styles.cardText}>Wallet</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardIcon}>📱</Text>
            <Text style={styles.cardText}>UPI</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.amount}>₹600</Text>
        <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#0057b3",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  payButton: {
    backgroundColor: "#0057b3",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PaymentPage;
