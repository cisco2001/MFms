import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const GeneratePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = () => {
        if (password === confirmPassword) {
            Alert.alert('Success', 'Password has been changed successfully');
        } else {
            Alert.alert('Error', 'Passwords do not match');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create New Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter new password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            <Button title="Submit" onPress={handlePasswordChange} />
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
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
});

export default GeneratePassword;