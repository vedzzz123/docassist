import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// @ts-ignore: no types for react-native-razorpay
import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from './App';

const AppointmentReceipt = ({ navigation, route }: any) => {
  const { appointmentData } = route.params || {};

  const handlePayment = async (): Promise<void> => {
    try {
      if (!appointmentData) {
        Alert.alert('Error', 'Appointment data missing');
        return;
      }

      console.log('🔍 Starting full payment process...');

      // Step 1: Get user and their details
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert('Authentication Error', 'Please log in first');
        return;
      }

      // Step 2: Get user details from user_details table
      const { data: userDetails, error: detailsError } = await supabase
        .from('user_details')
        .select('name, surname, phone_num')
        .eq('user_id', user.id)
        .single();

      if (detailsError || !userDetails) {
        Alert.alert('Profile Error', 'Please complete your profile first');
        return;
      }

      // Step 3: Create order via Edge Function
      const { data: orderData, error: orderErr } = await supabase.functions.invoke('create-order', {
        body: { 
          amountInPaise: appointmentData.cost * 100, // Convert to paise
          appointmentId: appointmentData
        },
      });

      if (orderErr || !orderData?.orderId) {
        Alert.alert('Order Error', orderErr?.message || 'Failed to create order');
        return;
      }

      console.log('✅ Order created:', orderData);

      // Step 4: Configure Razorpay options with real user data
      const options = {
        description: `Appointment with ${appointmentData.doctor_name}`,
        image: 'https://play-lh.googleusercontent.com/RhrVvntWra3Lc5sujiFh14FSPcs9HA3xqPHqPLur3pLuGU2u9htoMBkOJ54Jr3oJOQ',
        currency: 'INR',
        key: orderData.keyId,
        amount: orderData.amount,
        name: 'DocAssist',
        order_id: orderData.orderId,
        prefill: {
          email: user.email,
          contact: `+91${userDetails.phone_num}`, // Real phone number from database
          name: `${userDetails.name} ${userDetails.surname}`
        },
        theme: { 
          color: '#1976D2' 
        }
      };

      console.log('🔍 Opening Razorpay with real user data:', {
        email: options.prefill.email,
        contact: options.prefill.contact,
        name: options.prefill.name
      });

      // Step 5: Open Razorpay Checkout
      const paymentResult = await RazorpayCheckout.open(options);
      
      console.log('✅ Payment successful:', paymentResult);

      // Step 6: Verify payment on server
      const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('verify-payment', {
        body: {
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
          appointmentId: appointmentData,
        },
      });

      if (verifyErr || !verifyData?.valid) {
        Alert.alert('Payment Verification Failed', 'Please contact support.');
        return;
      }

      // Step 7: Success!
      Alert.alert(
        'Payment Successful! 🎉',
        `Your appointment with ${appointmentData.doctor_name} on ${appointmentData.appointmentDateDisplay} at ${appointmentData.time_slot} is confirmed.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );

    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error?.code === 'RN_RAZORPAY_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You can try again later.');
      } else {
        Alert.alert('Payment Failed', error?.message || 'Please try again.');
      }
    }
  };

  if (!appointmentData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AppointmentReceipt</Text>
        </View>
        <Text style={styles.errorText}>No appointment data found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AppointmentReceipt</Text>
      </View>

      <Text style={styles.title}>Appointment Summary</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Doctor:</Text>
          <Text style={styles.value}>{appointmentData.doctor_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Specialization:</Text>
          <Text style={styles.value}>{appointmentData.doctorSpecialization}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{appointmentData.appointmentDateDisplay}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{appointmentData.time_slot}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fees:</Text>
          <Text style={styles.value}>₹{appointmentData.cost}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
        <Text style={styles.payButtonText}>Pay ₹{appointmentData.cost}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  payButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default AppointmentReceipt;
