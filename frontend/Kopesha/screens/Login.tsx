import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused, setIsFocused] = useState({ username: false, password: false });

    const handleLogin = () => {
        // Handle login logic here
        console.log('Username:', username);
        console.log('Password:', password);
    };

    const handleForgotPassword = () => {
        // Handle forgot password logic here
        console.log('Forgot Password');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        isFocused.username && { borderColor: '#003366' }
                    ]}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setIsFocused({ ...isFocused, username: true })}
                    onBlur={() => setIsFocused({ ...isFocused, username: false })}
                />
                <TextInput
                    style={[
                        styles.input,
                        isFocused.password && { borderColor: '#003366' }
                    ]}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={() => setIsFocused({ ...isFocused, password: true })}
                    onBlur={() => setIsFocused({ ...isFocused, password: false })}
                />
            </View>
            <View style={styles.button}>
                <Button title="Login" onPress={handleLogin} />
            </View>
            <Button title="Forgot Password" onPress={handleForgotPassword} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
        width: '80%',
    },
    input: {
        height: 40,
        width: 180,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 6,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    button: {
        color: '#003366',
        width: 80,
        height: 40,
        borderRadius: 6, // Increased for more rounding
        justifyContent: 'center',

    }
});

export default Login;