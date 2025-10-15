import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import apiClient from '../../lib/api/client';

export default function SupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Missing info', 'Please enter a subject and message.');
      return;
    }
    try {
      setSending(true);
      await apiClient.post('/contact-support', {
        subject: subject.trim(),
        message: message.trim(),
      });
      Alert.alert('Sent', 'Your message has been sent. We will reply via email.');
      setSubject('');
      setMessage('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Contact Support</Text>
        <Text style={styles.subtitle}>We usually respond within 1-2 business days.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Briefly describe your issue"
            placeholderTextColor={COLORS.textSecondary}
            value={subject}
            onChangeText={setSubject}
            editable={!sending}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Provide details so we can help you faster"
            placeholderTextColor={COLORS.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            editable={!sending}
          />
        </View>

        <Button
          title={sending ? 'Sending...' : 'Send Message'}
          onPress={handleSubmit}
          disabled={sending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.xl },
  content: { padding: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.sizes.xxl, fontWeight: TYPOGRAPHY.weights.bold as any, color: COLORS.text },
  subtitle: { marginTop: SPACING.xs, marginBottom: SPACING.lg, color: COLORS.textSecondary },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: TYPOGRAPHY.sizes.sm, color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: SPACING.md, color: COLORS.text },
  textarea: { minHeight: 140, textAlignVertical: 'top' },
});
