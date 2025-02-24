import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { submitLoanApplication } from '../services/api'; // Import the submitLoanApplication function
// Define your navigation stack types
type RootStackParamList = {
  LoansScreen: { clientId: string }; // Add other screens if needed
};

// Define the props for LoansScreen
type LoansScreenProps = NativeStackScreenProps<RootStackParamList, 'LoansScreen'>;


interface LoanFormData {
  // Loan Details
  amount_requested: string;
  purpose: string;
  term_months: string;
  
  // Referee Details
  referee_name: string;
  referee_phone: string;
  referee_email: string;
  referee_relationship: string;
  referee_occupation: string;
  referee_workplace: string;
  referee_photo: string | null;
  referee_address: {
    region: string;
    district: string;
    ward: string;
    street_name: string;
    house_number?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Collateral Details
  collateral_type: string;
  collateral_description: string;
  collateral_photo: string | null;

}
interface ErrorWithMessage {
  message: string;
}
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Type guard for Constants.expoConfig
function getApiUrl(): string {
  if (!Constants.expoConfig?.extra?.apiUrl) {
    throw new Error('API URL not configured in app.config');
  }
  return Constants.expoConfig.extra.apiUrl;
}
const INITIAL_FORM_DATA: LoanFormData = {
  amount_requested: '',
  purpose: '',
  term_months: '',
  referee_name: '',
  referee_photo: null,
  referee_phone: '',
  referee_email: '',
  referee_relationship: '',
  referee_occupation: '',
  referee_workplace: '',
  referee_address: {
    region: '',
    district: '',
    ward: '',
    street_name: '',
    house_number: '',
  },
  collateral_type: 'other',
  collateral_description: '',
  collateral_photo: null,
};

const LoansScreen = ({ route, navigation }:  LoansScreenProps) => {
  const { clientId } = route.params;
  const { token } = useAuth();
  const [currentStage, setCurrentStage] = useState(0);
  const [formData, setFormData] = useState<LoanFormData>(INITIAL_FORM_DATA);
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const stages = ['Loan Details', 'Referee Information', 'Collateral Details'];

  const pickImage = async (field: 'referee_photo' | 'collateral_photo') => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
      });

      if (!result.canceled) {
          setFormData(prev => ({
              ...prev,
              [field]: result.assets[0].uri,
          }));
      }
  };

  const handleLocationPick = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Unable to access location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get address details from coordinates
      const [addressData] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setFormData(prev => ({
        ...prev,
        referee_address: {
          ...prev.referee_address,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          region: addressData.region || prev.referee_address.region,
          district: addressData.subregion || prev.referee_address.district,
          street_name: addressData.street || prev.referee_address.street_name,
        }
      }));
      
      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStage = () => {
    switch (currentStage) {
      case 0:
        if (!formData.amount_requested) {
          Alert.alert('Error', 'Please enter the requested amount');
          return false;
        }
        if (!formData.purpose) {
          Alert.alert('Error', 'Please enter the loan purpose');
          return false;
        }
        if (!formData.term_months) {
          Alert.alert('Error', 'Please enter the loan term');
          return false;
        }
        return true;

      case 1:
        if (!formData.referee_name) {
          Alert.alert('Error', 'Please enter referee name');
          return false;
        }
        if (!formData.referee_phone) {
          Alert.alert('Error', 'Please enter referee phone number');
          return false;
        }
        if (!formData.referee_relationship) {
          Alert.alert('Error', 'Please enter your relationship with the referee');
          return false;
        }
        if (!useGeolocation && !formData.referee_address.region) {
          Alert.alert('Error', 'Please enter the region');
          return false;
        }
        if (!useGeolocation && !formData.referee_address.district) {
          Alert.alert('Error', 'Please enter the district');
          return false;
        }
        if (!useGeolocation && !formData.referee_address.ward) {
          Alert.alert('Error', 'Please enter the ward');
          return false;
        }
        if (useGeolocation && !formData.referee_address.latitude) {
          Alert.alert('Error', 'Please capture the location');
          return false;
        }
        return true;

      case 2:
        if (!formData.collateral_type) {
          Alert.alert('Error', 'Please select collateral type');
          return false;
        }
        if (!formData.collateral_description) {
          Alert.alert('Error', 'Please enter collateral description');
          return false;
        }
        return true;

      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
  
      const formDataToSend = new FormData();
  
      // Add loan application fields
      formDataToSend.append('amount_requested', formData.amount_requested);
      formDataToSend.append('purpose', formData.purpose);
      formDataToSend.append('term_months', formData.term_months);
      formDataToSend.append('customer', clientId);
      formDataToSend.append('status', 'PENDING');
  
      // Add referee data
      formDataToSend.append('referee[full_name]', formData.referee_name);
      formDataToSend.append('referee[phone]', formData.referee_phone);
      formDataToSend.append('referee[email]', formData.referee_email || '');
      formDataToSend.append('referee[relationship]', formData.referee_relationship);
      formDataToSend.append('referee[occupation]', formData.referee_occupation || '');
      formDataToSend.append('referee[workplace]', formData.referee_workplace || '');
  
      // Add referee address
      formDataToSend.append('referee[address][region]', formData.referee_address.region || '');
      formDataToSend.append('referee[address][district]', formData.referee_address.district || '');
      formDataToSend.append('referee[address][ward]', formData.referee_address.ward || '');
      formDataToSend.append('referee[address][street_name]', formData.referee_address.street_name || '');
      if (formData.referee_address.house_number) {
        formDataToSend.append('referee[address][house_number]', formData.referee_address.house_number);
      }
  
      // Log what we're about to upload for debugging
      console.log('Preparing to upload referee photo:', formData.referee_photo ? 'Photo exists' : 'No photo');
  
      // Add referee photo (if available)
      if (formData.referee_photo) {
        const uriParts = formData.referee_photo.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        // Create a proper file object for React Native
        const photoFile = {
          uri: formData.referee_photo,
          name: `photo.${fileType}`,
          type: `image/${fileType}`
        };
        
        // @ts-ignore - TypeScript doesn't know about this structure but it works for React Native
        formDataToSend.append('referee[photo]', photoFile);
        console.log('Added referee photo to FormData');
      }
  
      // Add collateral data
      formDataToSend.append('collateral_type', formData.collateral_type);
      formDataToSend.append('collateral_description', formData.collateral_description);
  
      // Add collateral photo (if available)
      if (formData.collateral_photo) {
        const uriParts = formData.collateral_photo.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        // Create a proper file object for React Native
        const collateralFile = {
          uri: formData.collateral_photo,
          name: `collateral.${fileType}`,
          type: `image/${fileType}`
        };
        
        // @ts-ignore - TypeScript doesn't know about this structure but it works for React Native
        formDataToSend.append('collateral_photo', collateralFile);
        console.log('Added collateral photo to FormData');
      }
  
      try {
        // Send the request to the backend
        const response = await submitLoanApplication(formDataToSend, token);
        if (!response) {
          let errorMessage = 'Failed to submit loan application';
          // Only try to parse JSON if we got a response
          if (response) {
            // Success: Handle the successful response
            setIsSubmitted(true);
            navigation.goBack();
          } else {
            // Handle unexpected response
            throw new Error('Failed to submit loan application');
          }
          throw new Error(errorMessage);
        }
        navigation.goBack();
      } catch (apiError) {
        console.error('API call failed:', apiError);
        throw apiError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      const errorMessage = isErrorWithMessage(error)
        ? error.message
        : 'Failed to submit loan application';
      Alert.alert('Error', errorMessage);
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStageIndicator = () => (
    <View style={styles.stageIndicator}>
      {stages.map((stage, index) => (
        <View key={index} style={styles.stageItem}>
          <View style={[
            styles.stageCircle,
            currentStage === index && styles.activeStage,
            currentStage > index && styles.completedStage
          ]}>
            <Ionicons
              name={index === 0 ? 'cash-outline' : 
                    index === 1 ? 'person-outline' : 'shield-outline'}
              size={24}
              color={currentStage >= index ? '#fff' : '#666'}
            />
          </View>
          <Text style={[
            styles.stageText,
            currentStage === index && styles.activeStageText
          ]}>{stage}</Text>
        </View>
      ))}
    </View>
  );

  const renderLoanDetails = () => (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Amount Requested"
        value={formData.amount_requested}
        onChangeText={(text) => setFormData({ ...formData, amount_requested: text.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        placeholderTextColor="#666"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Purpose"
        value={formData.purpose}
        onChangeText={(text) => setFormData({ ...formData, purpose: text })}
        multiline
        numberOfLines={4}
        placeholderTextColor="#666"
      />

      <TextInput
        style={styles.input}
        placeholder="Term (months)"
        value={formData.term_months}
        onChangeText={(text) => setFormData({ ...formData, term_months: text.replace(/[^0-9]/g, '') })}
        keyboardType="numeric"
        placeholderTextColor="#666"
      />
    </View>
  );

  const renderRefereeDetails = () => (
    <View>
      <TextInput
        style={styles.input}
        placeholder="Referee Full Name"
        value={formData.referee_name}
        onChangeText={(text) => setFormData({ ...formData, referee_name: text })}
        placeholderTextColor="#666"
      />
      <View>
        {/* Existing fields... */}
        <TouchableOpacity onPress={() => pickImage('referee_photo')}>
            <Text>Upload Referee Photo</Text>
        </TouchableOpacity>
        {formData.referee_photo && <Image source={{ uri: formData.referee_photo }} style={{ width: 100, height: 100 }} />}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={formData.referee_phone}
        onChangeText={(text) => setFormData({ ...formData, referee_phone: text.replace(/[^0-9]/g, '') })}
        keyboardType="phone-pad"
        placeholderTextColor="#666"
      />

      <TextInput
        style={styles.input}
        placeholder="Email (Optional)"
        value={formData.referee_email}
        onChangeText={(text) => setFormData({ ...formData, referee_email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#666"
      />

      <TextInput
        style={styles.input}
        placeholder="Relationship to Customer"
        value={formData.referee_relationship}
        onChangeText={(text) => setFormData({ ...formData, referee_relationship: text })}
        placeholderTextColor="#666"
      />

      <TextInput
        style={styles.input}
        placeholder="Occupation"
        value={formData.referee_occupation}
        onChangeText={(text) => setFormData({ ...formData, referee_occupation: text })}
        placeholderTextColor="#666"
      />

      <TextInput
        style={styles.input}
        placeholder="Workplace"
        value={formData.referee_workplace}
        onChangeText={(text) => setFormData({ ...formData, referee_workplace: text })}
        placeholderTextColor="#666"
      />

      <View style={styles.addressSection}>
        <Text style={styles.sectionTitle}>Address Details</Text>
        
        <TouchableOpacity 
          style={styles.locationToggle}
          onPress={() => setUseGeolocation(!useGeolocation)}
        >
          <Text style={styles.toggleText}>
            {useGeolocation ? 'Switch to Manual Entry' : 'Use Current Location'}
          </Text>
          <Ionicons name="location-outline" size={20} color="#007AFF" />
        </TouchableOpacity>

        {useGeolocation ? (
          <TouchableOpacity 
            style={[styles.geoButton, isLoading && styles.disabledButton]}
            onPress={handleLocationPick}
            disabled={isLoading}
          >
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={styles.geoButtonText}>
              {isLoading ? 'Capturing Location...' : 'Capture Location'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Region"
              value={formData.referee_address.region}
              onChangeText={(text) => setFormData({
                ...formData,
                referee_address: { ...formData.referee_address, region: text }
              })}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="District"
              value={formData.referee_address.district}
              onChangeText={(text) => setFormData({
                ...formData,
                referee_address: { ...formData.referee_address, district: text }
              })}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Ward"
              value={formData.referee_address.ward}
              onChangeText={(text) => setFormData({
                ...formData,
                referee_address: { ...formData.referee_address, ward: text }
              })}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Street Name"
              value={formData.referee_address.street_name}
              onChangeText={(text) => setFormData({
                ...formData,
                referee_address: { ...formData.referee_address, street_name: text }
              })}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="House Number (Optional)"
              value={formData.referee_address.house_number}
              onChangeText={(text) => setFormData({
                ...formData,
                referee_address: { ...formData.referee_address, house_number: text }
              })}
              placeholderTextColor="#666"
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderCollateralDetails = () => (
    <View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.collateral_type}
          onValueChange={(value) => setFormData({ ...formData, collateral_type: value })}
          style={styles.picker}
        >
          <Picker.Item label="Vehicle" value="vehicle" />
          <Picker.Item label="Land" value="land" />
          <Picker.Item label="House" value="house" />
          <Picker.Item label="Equipment" value="equipment" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>
      <View>
        {/* Existing fields... */}
        <TouchableOpacity onPress={() => pickImage('collateral_photo')}>
            <Text>Upload Collateral Photo</Text>
        </TouchableOpacity>
        {formData.collateral_photo && <Image source={{ uri: formData.collateral_photo }} style={{ width: 100, height: 100 }} />}
    </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Collateral Description"
        value={formData.collateral_description}
        onChangeText={(text) => setFormData({ ...formData, collateral_description: text })}
        multiline
        numberOfLines={4}
        placeholderTextColor="#666"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {renderStageIndicator()}

        <View style={styles.formContainer}>
          {currentStage === 0 && renderLoanDetails()}
          {currentStage === 1 && renderRefereeDetails()}
          {currentStage === 2 && renderCollateralDetails()}
        </View>
      </ScrollView>

       {/* Green Tick for Success */}
    {isSubmitted && (
      <View style={styles.successOverlay}>
        <Ionicons name="checkmark-circle" size={100} color="#4CD964" />
        <Text style={styles.successText}>Loan application submitted successfully!</Text>
      </View>
    )}

      <View style={styles.navigationButtons}>
        {currentStage > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={() => setCurrentStage(currentStage - 1)}
          >
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.nextButton,
            isLoading && styles.disabledButton
          ]}
          onPress={() => {
            if (!validateStage()) {
              return;
            }
            if (currentStage < stages.length - 1) {
              setCurrentStage(currentStage + 1);
            } else {
              handleSubmit();
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStage === stages.length - 1 ? 'Submit' : 'Next'}
              </Text>
              {currentStage < stages.length - 1 && (
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Constants.statusBarHeight,
  },
  stageIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activeStage: {
    backgroundColor: '#007AFF',
  },
  completedStage: {
    backgroundColor: '#4CD964',
  },
  stageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeStageText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  addressSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
  },
  toggleText: {
    color: '#007AFF',
    marginRight: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  geoButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  geoButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  picker: {
    ...Platform.select({
      ios: {
        height: 150,
      },
      android: {
        height: 50,
      },
    }),
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    marginLeft: 'auto',
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#fff',
    marginRight: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
  },
  successText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

export default LoansScreen;