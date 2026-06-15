import React from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ShoppingBag, Eye } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Spacing } from '@/constants/theme';

export interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  storeId: string;
  store: {
    id: string;
    name: string;
  };
}

interface ProductCardProps {
  product: ProductData;
  onAddToCart?: (product: ProductData) => void;
  showAddToCart?: boolean;
}

export function ProductCard({ product, onAddToCart, showAddToCart = true }: ProductCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(product.price);

  const handlePress = () => {
    router.push(`/(public)/product/${product.id}`);
  };

  const getStockBadge = () => {
    if (product.stock === 0) {
      return <Badge label="Habis" variant="danger" />;
    }
    if (product.stock <= 5) {
      return <Badge label={`Sisa ${product.stock}`} variant="warning" />;
    }
    return <Badge label="Tersedia" variant="success" />;
  };

  return (
    <Card style={styles.cardContainer}>
      <Pressable onPress={handlePress}>
        {/* Ocean Theme Premium Gradient as image placeholder */}
        <LinearGradient
          colors={['#0D9488', '#0EA5E9', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientImage}
        >
          <ShoppingBag color="#FFFFFF" size={36} opacity={0.8} />
          <View style={styles.stockBadgeContainer}>{getStockBadge()}</View>
        </LinearGradient>

        <View style={styles.infoContainer}>
          <ThemedText style={styles.storeName} themeColor="textSecondary">
            {product.store.name}
          </ThemedText>
          <ThemedText style={styles.productName} numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText style={styles.productPrice}>
            {formattedPrice}
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.actionsContainer}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.actionButton,
            { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.background },
          ]}
        >
          <Eye size={16} color={theme.text} />
        </Pressable>
        {showAddToCart && product.stock > 0 && onAddToCart && (
          <Pressable
            onPress={() => onAddToCart(product)}
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
          >
            <ShoppingBag size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: Spacing.one * 1.5,
    padding: 0,
    overflow: 'hidden',
    maxWidth: Platform.OS === 'web' ? 240 : '48%',
  },
  gradientImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stockBadgeContainer: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
  },
  infoContainer: {
    padding: Spacing.three,
  },
  storeName: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.half,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D9488', // Highlight with teal color
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: Spacing.three,
    paddingTop: 0,
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
