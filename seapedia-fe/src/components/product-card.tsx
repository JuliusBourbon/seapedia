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
    <Card className="flex-1 m-[6px] p-0 overflow-hidden bg-black/5 dark:bg-white/5" style={{ maxWidth: Platform.OS === 'web' ? 240 : '48%' }}>
      <Pressable onPress={handlePress}>
        <View className="">{getStockBadge()}</View>

        <View className="p-2">
          <ThemedText className="font-bold">
            {product.name}
          </ThemedText>
          <ThemedText className="font-extrabold mb-2">
            {formattedPrice}
          </ThemedText>
          <ThemedText type='small' className="font-bold" themeColor="textSecondary">
            {product.store.name}
          </ThemedText>
        </View>
      </Pressable>

      <View className="flex-row p-3 pt-0 gap-2 justify-end">
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
