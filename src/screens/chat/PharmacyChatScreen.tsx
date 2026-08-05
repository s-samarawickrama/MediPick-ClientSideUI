import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Send, ShieldCheck, Clock } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useOrders } from '../../context/OrderContext';
import { MOCK_PHARMACIES } from '../../mock/demoData';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type ChatRouteProp = RouteProp<MainStackParamList, 'PharmacyChat'>;

export const PharmacyChatScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ChatRouteProp>();
  const orderId = route.params?.orderId || 'ord-101'; // Fallback for safety

  const { chatMessages, addChatMessage } = useOrders();
  const messages = chatMessages[orderId] || [];

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const pharmacy = MOCK_PHARMACIES[0]; // Could be dynamic based on order

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    
    addChatMessage(orderId, {
      senderRole: 'CUSTOMER',
      senderName: 'You',
      text,
    });
    
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    setTimeout(() => {
      addChatMessage(orderId, {
        senderRole: 'PHARMACIST',
        senderName: 'Pharmacist',
        text: 'Got it! Your items are safely stored until you arrive.',
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Uber Eats Style Chat Navbar */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={COLORS.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {pharmacy?.image ? (
            <Image source={pharmacy.image} style={s.pharmacyAvatarImg} />
          ) : (
            <View style={s.pharmacyAvatar}>
              <Text style={s.avatarInitial}>M</Text>
            </View>
          )}
          <View>
            <View style={s.pharmacyTitleRow}>
              <Text style={s.pharmacyName}>MediCare Central</Text>
              <ShieldCheck color={COLORS.midTeal} size={14} strokeWidth={2.5} />
            </View>
            <Text style={s.onlineText}>Online · Response time &lt; 5 mins</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Order Context Banner */}
      <View style={s.contextBanner}>
        <Text style={s.contextText}>Order {orderId} · Pickup Code Ready</Text>
      </View>

      {/* Message List */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => {
          const isCustomer = msg.senderRole === 'CUSTOMER';
          const isSystem = msg.senderRole === 'SYSTEM';

          if (isSystem) {
            return (
              <View key={msg.id} style={s.systemBubbleWrap}>
                <View style={s.systemBubble}>
                  <Clock color={COLORS.textMuted} size={12} strokeWidth={2.5} style={{ marginTop: 1 }} />
                  <Text style={s.systemText}>{msg.text}</Text>
                </View>
                <Text style={s.msgTimeCenter}>{msg.timestamp}</Text>
              </View>
            );
          }

          return (
            <View key={msg.id} style={[s.bubbleWrap, isCustomer && s.bubbleWrapCustomer]}>
              <View style={[s.bubble, isCustomer ? s.bubbleCustomer : s.bubblePharmacy]}>
                <Text style={[s.bubbleText, isCustomer ? s.bubbleCustomerText : s.bubblePharmacyText]}>
                  {msg.text}
                </Text>
              </View>
              <Text style={[s.msgTime, isCustomer && { textAlign: 'right' }]}>
                {msg.timestamp}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Uber Style Floating Input Bar */}
      <View style={s.inputBar}>
        <TextInput
          style={s.inputField}
          placeholder="Message pharmacist..."
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <Send color={input.trim() ? COLORS.white : COLORS.textMuted} size={16} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAF7' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pharmacyAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  pharmacyAvatarImg: {
    width: 40, height: 40, borderRadius: 12, resizeMode: 'cover',
  },
  avatarInitial: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.deepTeal },
  pharmacyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pharmacyName: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.peacockBlue },
  onlineText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.deepTeal, marginTop: 1 },

  contextBanner: {
    backgroundColor: COLORS.limeWhisper,
    paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#D6EDA0',
  },
  contextText: {
    fontFamily: FONTS.bold, fontSize: 12, color: COLORS.deepTeal, textAlign: 'center',
  },

  msgList: { padding: 16, paddingBottom: 20, gap: 12 },
  
  systemBubbleWrap: { alignItems: 'center', marginVertical: 10 },
  systemBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  systemText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textMuted },
  msgTimeCenter: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.borderSoft, marginTop: 4 },

  bubbleWrap: { maxWidth: '82%', alignSelf: 'flex-start' },
  bubbleWrapCustomer: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 16, padding: 13 },
  bubblePharmacy: {
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bubbleCustomer: {
    backgroundColor: COLORS.peacockBlue,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textDark, lineHeight: 20 },
  bubblePharmacyText: { color: COLORS.textDark },
  bubbleCustomerText: { color: '#FFFFFF' },
  msgTime: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted, marginTop: 4, paddingHorizontal: 4 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  inputField: {
    flex: 1, height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.peacockBlue,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.peacockBlue,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#F1F5F9' },
});
