import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';

// Define interfaces for form data
interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nidaNumber: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phoneNumber: string;
  email: string;
  occupation: string;
  groupName: string;
  groupMembers: string[];
  groupLeaderName: string;
  groupSize: string;
}

// Define type for client type
type ClientType = 'individual' | 'group';

const AddClient: React.FC = () => {
  const [clientType, setClientType] = useState<ClientType>('individual');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    nidaNumber: '',
    address: '',
    latitude: null,
    longitude: null,
    phoneNumber: '',
    email: '',
    occupation: '',
    groupName: '',
    groupMembers: [],
    groupLeaderName: '',
    groupSize: '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setFormData({
        ...formData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSubmit = () => {
    // Validation
    if (clientType === 'individual') {
      if (!formData.firstName || !formData.lastName || !formData.nidaNumber) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    } else {
      if (!formData.groupName || !formData.groupLeaderName || !formData.groupSize) {
        Alert.alert('Error', 'Please fill in all required group fields');
        return;
      }
    }

    // Here you would typically send the data to your backend
    console.log('Form submitted:', { clientType, ...formData });
    Alert.alert('Success', 'Client registration submitted successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Client Registration</Text>

        <View style={styles.clientTypeContainer}>
          <TouchableOpacity
            style={[
              styles.clientTypeButton,
              clientType === 'individual' && styles.activeClientType,
            ]}
            onPress={() => setClientType('individual')}
          >
            <Text style={[
              styles.clientTypeText,
              clientType === 'individual' && styles.activeClientTypeText
            ]}>Individual</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.clientTypeButton,
              clientType === 'group' && styles.activeClientType,
            ]}
            onPress={() => setClientType('group')}
          >
            <Text style={[
              styles.clientTypeText,
              clientType === 'group' && styles.activeClientTypeText
            ]}>Group</Text>
          </TouchableOpacity>
        </View>

        {clientType === 'individual' ? (
          // Individual Client Form
          <View>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              placeholder="Enter first name"
            />

            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              value={formData.middleName}
              onChangeText={(text) => handleInputChange('middleName', text)}
              placeholder="Enter middle name"
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              placeholder="Enter last name"
            />

            <Text style={styles.label}>NIDA Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.nidaNumber}
              onChangeText={(text) => handleInputChange('nidaNumber', text)}
              placeholder="Enter NIDA number"
              keyboardType="numeric"
            />
          </View>
        ) : (
          // Group Client Form
          <View>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.groupName}
              onChangeText={(text) => handleInputChange('groupName', text)}
              placeholder="Enter group name"
            />

            <Text style={styles.label}>Group Leader Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.groupLeaderName}
              onChangeText={(text) => handleInputChange('groupLeaderName', text)}
              placeholder="Enter group leader name"
            />

            <Text style={styles.label}>Group Size *</Text>
            <TextInput
              style={styles.input}
              value={formData.groupSize}
              onChangeText={(text) => handleInputChange('groupSize', text)}
              placeholder="Enter group size"
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Common fields for both individual and group */}
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => handleInputChange('address', text)}
          placeholder="Enter address manually"
          multiline
        />

        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.locationButtonText}>Use Current Location</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  clientTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  clientTypeButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007AFF',
    width: '45%',
  },
  activeClientType: {
    backgroundColor: '#007AFF',
  },
  clientTypeText: {
    textAlign: 'center',
    color: '#007AFF',
  },
  activeClientTypeText: {
    color: 'white',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  locationButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
  locationButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddClient;