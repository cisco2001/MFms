import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../app/App';
import { useAuth } from '../contexts/AuthContext';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState({ employeeId: false, password: false });
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      if (!employeeId || !password) {
        Alert.alert('Error', 'Please enter both Employee ID and password');
        return;
      }

      // Now using employeeId instead of email
      await login(employeeId, password);
    } catch (error) {
      Alert.alert(
        'Login Failed',
        'Invalid Employee ID or password. Please try again.'
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isFocused.employeeId && styles.inputFocused]}
          placeholder="Employee ID (RT***)"
          value={employeeId}
          onChangeText={setEmployeeId}
          autoCapitalize="characters"
          onFocus={() => setIsFocused({ ...isFocused, employeeId: true })}
          onBlur={() => setIsFocused({ ...isFocused, employeeId: false })}
          editable={!isLoading}
        />
        <TextInput
          style={[styles.input, isFocused.password && styles.inputFocused]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setIsFocused({ ...isFocused, password: true })}
          onBlur={() => setIsFocused({ ...isFocused, password: false })}
          editable={!isLoading}
        />
      </View>
      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>Login</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
        disabled={isLoading}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    color: '#003366',
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: 'white',
  },
  inputFocused: {
    borderColor: '#003366',
    borderWidth: 2,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#003366',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#667799',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#003366',
    fontSize: 14,
  },
});

export default LoginScreen;