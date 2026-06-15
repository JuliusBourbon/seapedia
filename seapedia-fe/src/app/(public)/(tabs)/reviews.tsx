import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
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
import { Spacing } from '@/constants/theme';
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
    return <View style={styles.starRow}>{stars}</View>;
  };

  const renderStarSelector = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Pressable key={i} onPress={() => setFormRating(i)} style={styles.starPressable}>
          <Star
            size={36}
            color={i <= formRating ? theme.warning : theme.border}
            fill={i <= formRating ? theme.warning : 'transparent'}
          />
        </Pressable>
      );
    }
    return <View style={styles.starSelectorRow}>{stars}</View>;
  };

  const renderReviewItem = ({ item }: { item: ReviewData }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <Card style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View>
            <ThemedText style={styles.reviewerName}>{item.reviewerName}</ThemedText>
            {renderStars(item.rating)}
          </View>
          <ThemedText style={styles.reviewDate} themeColor="textSecondary">
            {formattedDate}
          </ThemedText>
        </View>
        <ThemedText style={styles.reviewComment}>{item.comment}</ThemedText>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={{ color: theme.textSecondary }}>
          {error ? error : 'Belum ada review untuk aplikasi ini. Jadilah yang pertama!'}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: Spacing.three, color: theme.textSecondary }}>
            Memuat ulasan pengguna...
          </ThemedText>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
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

          <View style={styles.fabContainer}>
            <Button
              label="Tulis Review"
              leftIcon={<MessageSquarePlus size={20} color="#FFFFFF" />}
              onPress={() => setModalVisible(true)}
              style={styles.fabButton}
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
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ThemedView type="backgroundElement" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="smallBold" style={{ fontSize: 18 }}>
                  Tulis Review Aplikasi
                </ThemedText>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <X size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalForm}>
                <Input
                  label="Nama Pengulas"
                  placeholder="Masukkan nama Anda"
                  value={formName}
                  onChangeText={setFormName}
                  error={formErrors.reviewerName}
                  editable={!user?.name} // Lock if logged in
                />

                <View style={styles.ratingSection}>
                  <ThemedText type="smallBold" style={{ color: theme.textSecondary, marginBottom: Spacing.one }}>
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
                  inputStyle={{ height: 100, textAlignVertical: 'top', paddingTop: Spacing.two }}
                />

                <Button
                  label="Kirim Ulasan"
                  onPress={handleSubmitReview}
                  loading={submitting}
                  style={{ marginTop: Spacing.three }}
                />
              </ScrollView>
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: Spacing.four,
    paddingBottom: 80, // Space for FAB
  },
  reviewCard: {
    marginBottom: Spacing.three,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    marginTop: Spacing.one / 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.four,
    left: Spacing.four,
    right: Spacing.four,
  },
  fabButton: {
    borderRadius: 99,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: Spacing.one,
  },
  modalForm: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  ratingSection: {
    marginBottom: Spacing.three,
  },
  starSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    marginVertical: Spacing.two,
  },
  starPressable: {
    padding: Spacing.one,
  },
});
