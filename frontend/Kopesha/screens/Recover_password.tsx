import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const RecoverPasswordScreen = () => {
    const [email, setEmail] = useState('');

    const handleRecoverPassword = () => {
        // Handle password recovery logic here
        console.log('Recover password for:', email);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Recover Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={handleRecoverPassword}>
                    <Text style={styles.buttonText}>Recover</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backToLogin}>
                    <Text style={styles.backToLoginText}>Back to login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        height: 40,
        width: 180,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 16,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    button: {
        backgroundColor: '#003366',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    backToLogin: {
        padding: 10,
    },
    backToLoginText: {
        color: '#003366',
        fontSize: 16,
    },
});

export default RecoverPasswordScreen;