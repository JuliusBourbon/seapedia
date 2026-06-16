import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Star, MessageSquarePlus, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
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

  const fetchReviews = async () => {
    try {
      setError(null);
      const response = await api.get('/reviews');
      if (response.data?.success) {
        setReviews(response.data.data);
      } else {
        setError('Gagal memuat review');
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
        Alert.alert('Sukses', 'Terima kasih atas review Anda!');
        setModalVisible(false);
        setFormComment('');
        setFormRating(5);
        fetchReviews();
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        Alert.alert('Gagal', err.response?.data?.message || 'Gagal mengirim review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color={i <= rating ? theme.warning : theme.border}
          fill={i <= rating ? theme.warning : 'transparent'}
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
            color={i <= formRating ? theme.warning : theme.border}
            fill={i <= formRating ? theme.warning : 'transparent'}
          />
        </Pressable>
      );
    }
    return <View className="flex-row justify-between px-5 my-2">{stars}</View>;
  };

  const renderReviewItem = ({ item }: { item: ReviewData }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <Card className="mb-4">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <ThemedText className="text-base font-bold">{item.reviewerName}</ThemedText>
            {renderStars(item.rating)}
          </View>
          <ThemedText className="text-xs" themeColor="textSecondary">
            {formattedDate}
          </ThemedText>
        </View>
        <ThemedText className="text-sm leading-5">{item.comment}</ThemedText>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View className="items-center justify-center py-12">
        <ThemedText className="text-textSecondary text-center px-4">
          {error ? error : 'Belum ada review untuk aplikasi ini. Jadilah yang pertama!'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView className="flex-1">
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText className="mt-4 text-textSecondary">
            Memuat ulasan pengguna...
          </ThemedText>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerClassName="p-4"
            contentContainerStyle={{ paddingBottom: 136 + insets.bottom }}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          />

          <View className="absolute left-4 right-4" style={{ bottom: 68 + insets.bottom }}>
            <Button
              label="Tulis Review"
              leftIcon={<MessageSquarePlus size={20} color="#FFFFFF" />}
              onPress={() => setModalVisible(true)}
              className="rounded-full h-[52px] shadow-lg shadow-black/15 elevation-5"
            />
          </View>
        </View>
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
            <ThemedView type="backgroundElement" className="rounded-t-[24px] max-h-[85%]">
              <View className="flex-row justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
                <ThemedText type="smallBold" className="text-lg">
                  Tulis Review Aplikasi
                </ThemedText>
                <Pressable onPress={() => setModalVisible(false)} className="p-1">
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerClassName="p-4 pb-8">
                <Input
                  label="Nama Pengulas"
                  placeholder="Masukkan nama Anda"
                  value={formName}
                  onChangeText={setFormName}
                  error={formErrors.reviewerName}
                  editable={!user?.name} // Lock if logged in
                />

                <View className="mb-4">
                  <ThemedText type="smallBold" className="text-textSecondary mb-1">
                    Rating Aplikasi
                  </ThemedText>
                  {renderStarSelector()}
                </View>

                <Input
                  label="Komentar / Ulasan"
                  placeholder="Ceritakan pengalaman Anda menggunakan SEAPEDIA..."
                  value={formComment}
                  onChangeText={setFormComment}
                  error={formErrors.comment}
                  multiline
                  numberOfLines={4}
                  inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: 8 }}
                />

                <Button
                  label="Kirim Ulasan"
                  onPress={handleSubmitReview}
                  loading={submitting}
                  className="mt-4"
                />
              </ScrollView>
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}
