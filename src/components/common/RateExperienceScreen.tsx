import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, TextInput, Pressable,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Star, CheckCircle2, X } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';

interface RateExperienceScreenProps {
  visible: boolean;
  onClose: () => void;
  pharmacyName?: string;
}

export const RateExperienceScreen: React.FC<RateExperienceScreenProps> = ({
  visible,
  onClose,
  pharmacyName = 'MediCare Central Pharmacy',
}) => {
  const [overallRating, setOverallRating]   = useState(5);
  const [serviceRating, setServiceRating]   = useState(5);
  const [availRating, setAvailRating]       = useState(5);
  const [pickupRating, setPickupRating]     = useState(5);
  const [comments, setComments]             = useState('');
  const [submitted, setSubmitted]           = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  const renderStars = (currentRating: number, onSelect: (rating: number) => void, size = 20) => (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onSelect(star)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Star
            color={star <= currentRating ? '#F59E0B' : '#E2E8F0'}
            fill={star <= currentRating ? '#F59E0B' : 'transparent'}
            size={size}
            strokeWidth={2}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Rate Your Experience</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X color="#64748B" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={s.successBox}>
              <CheckCircle2 color={COLORS.midTeal} size={52} strokeWidth={2} />
              <Text style={s.successTitle}>Review Submitted!</Text>
              <Text style={s.successSub}>Thank you for rating {pharmacyName}.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
              {/* Question 1: Overall */}
              <View style={s.mainQuestionBox}>
                <Text style={s.mainQuestionLabel}>How was your overall experience?</Text>
                {renderStars(overallRating, setOverallRating, 32)}
              </View>

              <View style={s.divider} />

              {/* Sub Questions */}
              <View style={s.subQuestionsWrap}>
                <View style={s.questionRow}>
                  <Text style={s.questionLabel}>Pharmacy Service</Text>
                  {renderStars(serviceRating, setServiceRating, 22)}
                </View>

                <View style={s.questionRow}>
                  <Text style={s.questionLabel}>Product Availability</Text>
                  {renderStars(availRating, setAvailRating, 22)}
                </View>

                <View style={s.questionRow}>
                  <Text style={s.questionLabel}>Counter Pick Up Experience</Text>
                  {renderStars(pickupRating, setPickupRating, 22)}
                </View>
              </View>

              {/* Comments */}
              <View style={s.inputBox}>
                <Text style={s.inputLabel}>Additional comments (optional)</Text>
                <TextInput
                  style={s.textInput}
                  placeholder="Type here..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={comments}
                  onChangeText={setComments}
                />
              </View>

              {/* Actions */}
              <Button
                title="Submit Review"
                variant="primary"
                onPress={handleSubmit}
                style={{ marginTop: 4 }}
              />

              <TouchableOpacity style={s.skipBtn} onPress={onClose}>
                <Text style={s.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, maxHeight: '90%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontFamily: FONTS.black, fontSize: 18, color: '#0F172A' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },

  content: { paddingTop: 16, gap: 16 },

  mainQuestionBox: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  mainQuestionLabel: { fontFamily: FONTS.bold, fontSize: 15, color: '#334155' },
  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },

  divider: { height: 1, backgroundColor: '#F1F5F9' },

  subQuestionsWrap: { gap: 14 },
  questionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  questionLabel: { fontFamily: FONTS.medium, fontSize: 13, color: '#475569' },

  inputBox: { gap: 6 },
  inputLabel: { fontFamily: FONTS.medium, fontSize: 12, color: '#64748B' },
  textInput: {
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 12, height: 80, textAlignVertical: 'top',
    fontFamily: FONTS.regular, fontSize: 13, color: '#0F172A',
  },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.textMuted },

  successBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  successTitle: { fontFamily: FONTS.black, fontSize: 20, color: '#0F172A' },
  successSub: { fontFamily: FONTS.medium, fontSize: 13, color: '#64748B', textAlign: 'center' },
});
