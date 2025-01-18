import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const OtpScreen = () => {
    const [otp, setOtp] = useState(['', '', '', '']);

    const handleOtpChange = (value: string, index: number) => {
        if (/^\d*$/.test(value) && value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
        }
    };

    const handleSubmit = () => {
        // Handle OTP submission
        console.log('OTP Submitted:', otp.join(''));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter OTP</Text>
            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.input}
                        keyboardType="numeric"
                        maxLength={1}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                    />
                ))}
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
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
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        color: '#003366',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: 20,
    },
    input: {
        width: '20%',
        height: 40,
        borderColor: '#003366',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        fontSize: 20,
        textAlign: 'center',
    },
    button: {
        height: 50,
        backgroundColor: '#003366',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
});

export default OtpScreen;
