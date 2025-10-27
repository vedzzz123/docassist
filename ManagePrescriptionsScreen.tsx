import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';

type PrescriptionField = {
  key: string;
  label: string;
  placeholder: string;
  multiline: boolean;
};

const TEMPLATE_FIELDS: PrescriptionField[] = [
  { key: 'patientName', label: 'Patient Name:', placeholder: 'Enter patient name', multiline: false },
  { key: 'problem', label: 'Problem:', placeholder: 'Describe the problem', multiline: true },
  { key: 'medication', label: 'Medicines:', placeholder: 'Enter medicines', multiline: false },
  { key: 'dosage', label: 'Dosage:', placeholder: 'Specify dosage', multiline: false },
  { key: 'duration', label: 'Duration:', placeholder: 'Duration period', multiline: false },
];

const ManagePrescriptionsScreen = () => {
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      patientName: 'John Smith',
      medication: 'Amoxicillin 500mg',
      dosage: '3 times daily',
      duration: '7 days',
      date: '2025-09-13',
      problem: '',
    },
    {
      id: 2,
      patientName: 'Sarah Johnson',
      medication: 'Lisinopril 10mg',
      dosage: 'Once daily',
      duration: '30 days',
      date: '2025-09-12',
      problem: '',
    },
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [editorFields, setEditorFields] = useState<{ [key: string]: string }>(
    Object.fromEntries(TEMPLATE_FIELDS.map(x => [x.key, '']))
  );

  const handleEditorChange = (key: string, value: string) => {
    setEditorFields({ ...editorFields, [key]: value });
  };

  const handleEditorSave = () => {
    const empty = TEMPLATE_FIELDS.find(f => !editorFields[f.key].trim());
    if (empty) {
      Alert.alert('Error', `Please fill the "${empty.label}" field`);
      return;
    }
    const prescription = {
      id: prescriptions.length + 1,
      patientName: editorFields.patientName,
      medication: editorFields.medication,
      dosage: editorFields.dosage,
      duration: editorFields.duration,
      date: new Date().toISOString().split('T')[0],
      problem: editorFields.problem,
    };
    setPrescriptions([...prescriptions, prescription]);
    setShowEditor(false);
    setEditorFields(Object.fromEntries(TEMPLATE_FIELDS.map(x => [x.key, ''])));
    Alert.alert('Success', 'Prescription added successfully');
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    setEditorFields(Object.fromEntries(TEMPLATE_FIELDS.map(x => [x.key, ''])));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💊 Manage Prescriptions</Text>
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowEditor(true)}>
          <Text style={styles.addButtonText}>Add Prescription</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showEditor} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.editorContainer}>
            <Text style={styles.formTitle}>Write Prescription Details</Text>
            {TEMPLATE_FIELDS.map((field, idx) => (
              <View key={field.key} style={{ marginBottom: 14 }}>
                <Text style={styles.labelStyle}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.editorInput,
                    field.multiline ? styles.multilineInput : null,
                  ]}
                  value={editorFields[field.key]}
                  onChangeText={(val: string) => handleEditorChange(field.key, val)}
                  placeholder={field.placeholder}
                  multiline={field.multiline}
                  autoFocus={idx === 0}
                />
              </View>
            ))}
            <View style={styles.editorButtonsRow}>
              <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 6 }]} onPress={handleEditorSave}>
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { flex: 1, backgroundColor: "#aaa" }]} onPress={handleEditorCancel}>
                <Text style={styles.addButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
      <ScrollView style={styles.scrollView}>
        {prescriptions.map((prescription) => (
          <View key={prescription.id} style={styles.prescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <Text style={styles.patientName}>{prescription.patientName}</Text>
              <Text style={styles.prescriptionDate}>{prescription.date}</Text>
            </View>
            <View style={styles.prescriptionDetails}>
              <Text style={styles.medication}>{prescription.medication}</Text>
              <Text style={styles.dosage}>📋 {prescription.dosage}</Text>
              <Text style={styles.duration}>⏱️ {prescription.duration}</Text>
              {prescription.problem ? (
                <Text style={styles.note}>📝 {prescription.problem}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  prescriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  prescriptionDate: {
    fontSize: 14,
    color: '#666',
  },
  prescriptionDetails: {
    gap: 6,
  },
  medication: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
  },
  dosage: {
    fontSize: 14,
    color: '#666',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  // Modal/editor-specific styles:
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '90%',
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  labelStyle: {
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 3,
    marginLeft: 2,
  },
  editorInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 2,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  multilineInput: {
    minHeight: 60,
    maxHeight: 120,
  },
  editorButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  note: {
    fontSize: 14,
    color: "#444",
    marginTop: 8
  }
});

export default ManagePrescriptionsScreen;
