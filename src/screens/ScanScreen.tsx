import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Upload } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientBackground } from '../components/GradientBackground';
import { GlassSurface } from '../components/GlassSurface';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressDots } from '../components/ProgressDots';
import { colors } from '../theme/colors';
import { useAppDispatch } from '../hooks/useRedux';
import { completeScan, startScan } from '../store/scanSlice';
import type { RootStackParamList } from '../navigation/types';
import { uploadReceipt } from '../services/ocr';

export function ScanScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Scan'>) {
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useAppDispatch();

  const processImage = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      const { uri, mimeType, type, fileName } = asset;
      setSelectedImage(uri);
      dispatch(startScan());
      setIsProcessing(true);

      try {
        const response = await uploadReceipt({
          uri,
          filename: fileName ?? 'receipt.jpg',
          mimeType: mimeType ?? (type === 'video' ? 'video/mp4' : 'image/jpeg'),
        });

        dispatch(
          completeScan({
            ...response,
            imageUri: uri,
          }),
        );
        navigation.navigate('Result');
      } catch (error) {
        console.error('[OCR] upload failed', error);
        const message = error instanceof Error ? error.message : "Impossible de traiter le reçu.";
        Alert.alert('Erreur OCR', message);
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, navigation],
  );

  const ensurePermission = async (type: 'camera' | 'media') => {
    const request =
      type === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await request();
    if (status !== 'granted') {
      Alert.alert(
        'Autorisation requise',
        type === 'camera'
          ? "Nous avons besoin de l'accès à la caméra pour scanner vos reçus."
          : "Nous avons besoin de l'accès à votre galerie pour importer un reçu.",
      );
      return false;
    }

    return true;
  };

  const handleTakePhoto = async () => {
    if (isProcessing) return;
    const allowed = await ensurePermission('camera');
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
      mediaTypes: 'images',
    });

    if (!result.canceled && result.assets?.[0]) {
      await processImage(result.assets[0]);
    }
  };

  const handleUploadPhoto = async () => {
    if (isProcessing) return;
    const allowed = await ensurePermission('media');
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: false,
      mediaTypes: 'images',
    });

    if (!result.canceled && result.assets?.[0]) {
      await processImage(result.assets[0]);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.progressContainer}>
            <ProgressDots activeIndex={1} />
          </View>

          <View style={styles.header}>
            <IconButton onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color={colors.textMuted} />
            </IconButton>
            <Text style={styles.title}>Scanner un reçu</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.content}>
            {!isProcessing && !selectedImage && (
              <>
                <GlassSurface variant="strong" style={styles.card}>
                  <GlassSurface variant="subtle" style={styles.iconSurface}>
                    <Camera size={48} color={colors.textMuted} />
                  </GlassSurface>
                  <Text style={styles.cardTitle}>Prendre une photo</Text>
                  <Text style={styles.cardSubtitle}>Capturez directement votre reçu</Text>
                  <PrimaryButton onPress={handleTakePhoto} fullWidth>
                    Ouvrir l'appareil photo
                  </PrimaryButton>
                </GlassSurface>

                <GlassSurface variant="soft" style={styles.card}>
                  <GlassSurface variant="subtle" style={styles.iconSurface}>
                    <Upload size={48} color={colors.textMuted} />
                  </GlassSurface>
                  <Text style={styles.cardTitle}>Importer depuis la galerie</Text>
                  <Text style={styles.cardSubtitle}>Sélectionnez une photo existante</Text>
                  <PrimaryButton onPress={handleUploadPhoto} fullWidth>
                    Choisir un fichier
                  </PrimaryButton>
                </GlassSurface>
              </>
            )}

            {(isProcessing || selectedImage) && (
              <GlassSurface variant="strong" style={styles.processingCard}>
                {selectedImage ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                  </View>
                ) : null}
                <View style={styles.processingContent}>
                  <View style={styles.loaderCircle}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                  <Text style={styles.processingTitle}>
                    {isProcessing ? 'Extraction des détails...' : 'Préparation de vos données'}
                  </Text>
                  <Text style={styles.processingSubtitle}>
                    Analyse du reçu en cours, veuillez patienter
                  </Text>
                </View>
              </GlassSurface>
            )}
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    gap: 16,
  },
  card: {
    gap: 16,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconSurface: {
    padding: 18,
    borderRadius: 28,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  processingCard: {
    gap: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  imagePreview: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  processingContent: {
    alignItems: 'center',
    gap: 12,
  },
  loaderCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingSubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
