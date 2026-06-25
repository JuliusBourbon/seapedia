import { StyleSheet, View, Pressable, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingBag, Eye } from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

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
    <Card className="flex-1 m-[6px] p-0 overflow-hidden bg-neutral-100 border border-neutral-200" style={{ maxWidth: Platform.OS === 'web' ? 240 : '48%' }}>
      <Pressable onPress={handlePress}>
        <View className="p-2">
          <Image
            source={require('../../assets/images/icon.png')}
            className="w-28 h-28"
          />
          <ThemedText className="font-bold">
            {product.name}
          </ThemedText>
          <ThemedText type='small' className="font-bold text-neutral-500">
            {product.store.name}
          </ThemedText>
          <ThemedText className="font-extrabold mb-2">
            {formattedPrice}
          </ThemedText>
          <View>{getStockBadge()}</View>
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
