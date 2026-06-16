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
    <Card className="flex-1 m-[6px] p-0 overflow-hidden" style={{ maxWidth: Platform.OS === 'web' ? 240 : '48%' }}>
      <Pressable onPress={handlePress}>
        {/* Ocean Theme Premium Gradient as image placeholder */}
        <LinearGradient
          colors={['#0D9488', '#0EA5E9', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-[120px] items-center justify-center relative"
        >
          <ShoppingBag color="#FFFFFF" size={36} opacity={0.8} />
          <View className="absolute top-2 left-2">{getStockBadge()}</View>
        </LinearGradient>

        <View className="p-3">
          <ThemedText className="text-[11px] uppercase font-bold tracking-wider mb-1" themeColor="textSecondary">
            {product.store.name}
          </ThemedText>
          <ThemedText className="text-[15px] font-bold mb-2" numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText className="text-[16px] font-extrabold text-[#0D9488]">
            {formattedPrice}
          </ThemedText>
        </View>
      </Pressable>

      <View className="flex-row p-3 pt-0 gap-2 justify-end">
        <Pressable
          onPress={handlePress}
          className="w-9 h-9 rounded-lg items-center justify-center border"
          style={{ borderColor: theme.border, backgroundColor: theme.background }}
        >
          <Eye size={16} color={theme.text} />
        </Pressable>
        {showAddToCart && product.stock > 0 && onAddToCart && (
          <Pressable
            onPress={() => onAddToCart(product)}
            className="w-9 h-9 rounded-lg items-center justify-center"
            style={{ backgroundColor: theme.primary }}
          >
            <ShoppingBag size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </Card>
  );
}
