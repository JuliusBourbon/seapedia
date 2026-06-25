import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Star, MessageSquarePlus, X, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

interface ReviewData {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ApplicationReviewsScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [loading]);

  const fetchReviews = async () => {
    try {
      setError(null);
      const response = await api.get('/reviews');
      if (response.data?.success) {
        setReviews(response.data.data);
      } else {
        setError('Gagal memuat ulasan');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Autofill name if user is logged in
  useEffect(() => {
    if (user?.name) {
      setFormName(user.name);
    } else {
      setFormName('');
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.reviewerName = 'Nama wajib diisi';
    }
    if (!formComment.trim()) {
      errors.comment = 'Komentar wajib diisi';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitReview = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        reviewerName: formName,
        rating: formRating,
        comment: formComment,
      };

      const response = await api.post('/reviews', payload);
      if (response.data?.success) {
        Alert.alert('Sukses', 'Terima kasih atas ulasan Anda!');
        setModalVisible(false);
        setFormComment('');
        setFormRating(5);
        fetchReviews();
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengirim ulasan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color={i <= rating ? theme.secondary : theme.neutral[300]}
          fill={i <= rating ? theme.secondary : 'transparent'}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View className="flex-row mt-1">{stars}</View>;
  };

  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Pressable key={i} onPress={() => setFormRating(i)} className="p-1">
          <Star
            size={36}
            color={i <= formRating ? theme.secondary : theme.neutral[300]}
            fill={i <= formRating ? theme.secondary : 'transparent'}
          />
        </Pressable>
      );
    }
    return <View className="flex-row justify-between px-5 my-2">{stars}</View>;
  };

  // ── Skeleton Loading ────────────────────────────────────
  const renderSkeleton = () => (
    <Animated.View style={{ opacity: pulseAnim }} className="px-4 pt-4">
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          className="mb-4 p-4 rounded-2xl"
          style={{ backgroundColor: theme.neutral[50], shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
        >
          <View className="flex-row justify-between mb-3">
            <View>
              <View className="h-4 rounded-full mb-2" style={{ width: 120, backgroundColor: theme.neutral[200] }} />
              <View className="h-3 rounded-full" style={{ width: 80, backgroundColor: theme.neutral[200] }} />
            </View>
            <View className="h-3 rounded-full" style={{ width: 60, backgroundColor: theme.neutral[200] }} />
          </View>
          <View className="h-3 rounded-full mb-2" style={{ width: '100%', backgroundColor: theme.neutral[200] }} />
          <View className="h-3 rounded-full" style={{ width: '70%', backgroundColor: theme.neutral[200] }} />
        </View>
      ))}
    </Animated.View>
  );

  const renderReviewItem = ({ item }: { item: ReviewData }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const initials = item.reviewerName.substring(0, 2).toUpperCase();

    return (
      <View
        className="mb-4 p-4 rounded-2xl"
        style={{ backgroundColor: theme.neutral[50] }}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.primaryShades[100] }}
            >
              <ThemedText className="font-bold text-sm" style={{ color: theme.primaryShades[700] }}>
                {initials}
              </ThemedText>
            </View>
            <View>
              <ThemedText className="text-sm font-bold" style={{ color: theme.neutral[900] }}>
                {item.reviewerName}
              </ThemedText>
              {renderStars(item.rating)}
            </View>
          </View>
          <ThemedText className="text-xs" style={{ color: theme.neutral[400] }}>
            {formattedDate}
          </ThemedText>
        </View>
        <ThemedText className="text-sm leading-5" style={{ color: theme.neutral[700] }}>
          {item.comment}
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return renderSkeleton();
    return (
      <View className="items-center justify-center py-16 px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: theme.neutral[200] }}
        >
          <MessageCircle size={36} color={theme.primaryShades[400]} />
        </View>
        <ThemedText className="text-base font-semibold text-center mb-1" style={{ color: theme.neutral[900] }}>
          {error ? 'Terjadi Kesalahan' : 'Belum Ada Ulasan'}
        </ThemedText>
        <ThemedText className="text-sm text-center leading-5" style={{ color: theme.neutral[400] }}>
          {error
            ? error
            : 'Jadilah yang pertama memberikan ulasan dan membagikan pengalaman Anda.'}
        </ThemedText>
      </View>
    );
  };

  // Calculate stats for the header
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: theme.neutral[100] }}>
      {loading && !refreshing ? (
        <View className="flex-1">
          {renderSkeleton()}
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 88 }}
            ListEmptyComponent={renderEmpty}
            ListHeaderComponent={
              totalReviews > 0 ? (
                <View className="mb-4 flex-row items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: theme.neutral[50] }}>
                  <View>
                    <ThemedText className="text-2xl font-extrabold" style={{ color: theme.neutral[900] }}>
                      {avgRating} <ThemedText className="text-sm font-normal" style={{ color: theme.neutral[400] }}>/ 5.0</ThemedText>
                    </ThemedText>
                    <ThemedText className="text-xs" style={{ color: theme.neutral[500] }}>
                      Berdasarkan {totalReviews} ulasan
                    </ThemedText>
                  </View>
                  <View className="items-end">
                    {renderStars(Math.round(Number(avgRating)), 20)}
                  </View>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />

          <View
            className="absolute bottom-0 left-0 right-0 p-4 border-t"
            style={{
              backgroundColor: theme.neutral[50],
              borderColor: theme.neutral[200],
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16
            }}
          >
            <Button
              label="Tulis Ulasan"
              leftIcon={<MessageSquarePlus size={20} color={theme.neutral[50]} />}
              onPress={() => setModalVisible(true)}
              className="rounded-full h-[52px]"
            />
          </View>
        </Animated.View>
      )}

      {/* Review Submission Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <ThemedView className="rounded-t-[24px]" style={{ backgroundColor: theme.neutral[50] }}>
              <View className="flex-row justify-between items-center p-5 border-b" style={{ borderColor: theme.neutral[200] }}>
                <ThemedText className="text-lg font-bold" style={{ color: theme.neutral[900] }}>
                  Tulis Ulasan
                </ThemedText>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.neutral[100] }}
                >
                  <X size={18} color={theme.neutral[600]} />
                </Pressable>
              </View>

              <ScrollView contentContainerClassName="p-5 pb-8">
                <Input
                  label="Nama Pengulas"
                  placeholder="Masukkan nama Anda"
                  value={formName}
                  onChangeText={setFormName}
                  error={formErrors.reviewerName}
                  editable={!user?.name}
                  inputClasses="text-[15px]"
                />

                <View className="mb-5 mt-2">
                  <ThemedText className="text-sm font-semibold mb-2" style={{ color: theme.neutral[700] }}>
                    Rating Aplikasi
                  </ThemedText>
                  <View className="items-center bg-neutral-100/50 rounded-xl py-2">
                    {renderStarSelector()}
                  </View>
                </View>

                <Input
                  label="Komentar / Ulasan"
                  placeholder="Ceritakan pengalaman Anda menggunakan aplikasi ini..."
                  value={formComment}
                  onChangeText={setFormComment}
                  error={formErrors.comment}
                  multiline
                  numberOfLines={4}
                  inputClasses="text-[15px] h-24"
                />

                <Button
                  label="Kirim Ulasan"
                  onPress={handleSubmitReview}
                  loading={submitting}
                  className="mt-6 rounded-xl h-[52px]"
                />
              </ScrollView>
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}
