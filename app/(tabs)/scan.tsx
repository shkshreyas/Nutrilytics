import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Modal, Image, ColorValue, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, RotateCcw, Image as ImageIcon, Zap, X, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Barcode, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AIService, FoodAnalysis } from '../../services/aiService';
import { enhancedScanService, ScanResult } from '../../services/enhancedScanService';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { Colors, GlobalStyles } from '../../theme';
import BarcodeScanner from '../../components/BarcodeScanner';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const { user } = useAuth();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanResults, setScanResults] = useState<FoodAnalysis | null>(null);
  const [enhancedResults, setEnhancedResults] = useState<ScanResult | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanMethod, setScanMethod] = useState<'ai' | 'enhanced' | 'barcode' | 'ocr' | 'combined'>('enhanced');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (user?.uid) {
      UserService.getUserData(user.uid).then(data => {
        setUserAllergens(data?.allergens || []);
      });
    }
  }, [user]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={64} color="#10B981" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to scan food items for allergens
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsAnalyzing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        await analyzePicture(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        setIsAnalyzing(false);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setIsAnalyzing(true);
      await analyzePicture(result.assets[0].uri);
    }
  };

  const analyzePicture = async (imageUri: string) => {
    try {
      setStreamingText('');
      let userAllergensFetched: string[] = [];
      if (user?.uid) {
        const userData = await UserService.getUserData(user.uid);
        userAllergensFetched = userData?.allergens || [];
        setUserAllergens(userAllergensFetched);
      }

      // Enhanced scanning with multiple APIs
      const enhancedResult = await enhancedScanService.scanFood(imageUri);
      setEnhancedResults(enhancedResult);
      setScanMethod(enhancedResult.method);

      // Also run Firebase AI analysis for comparison
      try {
        const aiAnalysis = await AIService.analyzeFoodImage(imageUri, userAllergensFetched);
        setScanResults(aiAnalysis);
      } catch (aiError) {
        console.log('Firebase AI analysis failed, using enhanced results only');
      }

      // Update user stats and save scan to history
      if (user?.uid) {
        const hasAllergens = enhancedResult.allergens.length > 0;
        await UserService.addScanResult(user.uid, hasAllergens);
        await UserService.saveScanToHistory(user.uid, {
          name: enhancedResult.productName || 'Unknown Food',
          brand: 'Unknown',
          status: hasAllergens ? 'danger' : 'safe',
          allergens: enhancedResult.allergens,
          scanDate: new Date().toISOString(),
          confidence: Math.round(enhancedResult.confidence * 100),
        });
      }

      setIsAnalyzing(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Error', 'Failed to analyze the image. Please try again.');
      setIsAnalyzing(false);
      setShowResults(true);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setIsAnalyzing(true);
    
    try {
      const barcodeResult = await enhancedScanService.lookupBarcode(barcode);
      if (barcodeResult) {
        setEnhancedResults(barcodeResult);
        setScanMethod('barcode');
        
        // Update user stats
        if (user?.uid) {
          const hasAllergens = barcodeResult.allergens.length > 0;
          await UserService.addScanResult(user.uid, hasAllergens);
          await UserService.saveScanToHistory(user.uid, {
            name: barcodeResult.productName || 'Unknown Product',
            brand: 'Unknown',
            status: hasAllergens ? 'danger' : 'safe',
            allergens: barcodeResult.allergens,
            scanDate: new Date().toISOString(),
            confidence: Math.round(barcodeResult.confidence * 100),
          });
        }
      } else {
        Alert.alert('Product Not Found', 'This barcode was not found in our database. Try scanning the ingredients list instead.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to look up product information.');
    }
    
    setIsAnalyzing(false);
    setShowResults(true);
  };

  const closeResults = () => {
    setShowResults(false);
    setScanResults(null);
    setEnhancedResults(null);
  };

  const getMethodIcon = () => {
    switch (scanMethod) {
      case 'barcode':
        return <Barcode size={20} color="#3B82F6" />;
      case 'enhanced':
      case 'ocr':
        return <FileText size={20} color="#10B981" />;
      case 'ai':
        return <Zap size={20} color="#F59E0B" />;
      case 'combined':
        return <Zap size={20} color="#8B5CF6" />;
      default:
        return <Zap size={20} color="#F59E0B" />;
    }
  };

  const getMethodText = () => {
    switch (scanMethod) {
      case 'barcode':
        return 'Barcode Lookup';
      case 'enhanced':
      case 'ocr':
        return 'Enhanced OCR';
      case 'ai':
        return 'AI Analysis';
      case 'combined':
        return 'Combined Analysis';
      default:
        return 'AI Analysis';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradient as [ColorValue, ColorValue]}
        style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Image source={require('../../assets/images/icon.png')} style={{ width: 40, height: 40, marginRight: 12 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF' }} numberOfLines={1} ellipsizeMode="tail">Scan Food</Text>
          <Text style={{ fontSize: 14, color: '#FFF', opacity: 0.9 }}>Point camera at food labels or items</Text>
        </View>
      </LinearGradient>

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <View style={{ width: width * 0.85, height: width * 0.85, borderRadius: 32, overflow: 'hidden', backgroundColor: Colors.background }}>
          <CameraView
            style={{ flex: 1 }}
            facing={facing}
            ref={cameraRef}
          />
          {/* Overlay absolutely positioned on top of CameraView */}
          <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }} pointerEvents="none">
            <View style={{ width: '80%', height: '60%', borderWidth: 3, borderColor: Colors.primary, borderRadius: 24, backgroundColor: 'transparent' }} />
            <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15, marginTop: 16, backgroundColor: '#FFFFFFDD', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>Position food item within the frame</Text>
          </View>
        </View>
      </View>

      {/* Top row - Gallery, Barcode, Camera Flip buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 24, marginBottom: 16, paddingHorizontal: 20 }}>
        <TouchableOpacity style={[GlobalStyles.roundedButton, { backgroundColor: Colors.card, padding: 16 }]} onPress={pickImage}>
          <ImageIcon size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[GlobalStyles.roundedButton, { backgroundColor: Colors.card, padding: 16 }]} onPress={() => setShowBarcodeScanner(true)}>
          <Barcode size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[GlobalStyles.roundedButton, { backgroundColor: Colors.card, padding: 16 }]} onPress={toggleCameraFacing}>
          <RotateCcw size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Bottom row - Main Camera button */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity
          style={[GlobalStyles.roundedButton, { backgroundColor: Colors.info, elevation: 8, shadowColor: Colors.info, padding: 18 }]}
          onPress={takePicture}
          disabled={isAnalyzing}
        >
          <LinearGradient
            colors={Colors.gradient as [ColorValue, ColorValue]}
            style={{ borderRadius: 32, width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Camera size={36} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Analyzing Modal */}
      <Modal visible={isAnalyzing} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.analyzingContainer}>
            <LinearGradient
              colors={Colors.gradientBlue as [ColorValue, ColorValue]}
              style={[GlobalStyles.card, { alignItems: 'center', borderRadius: 24, padding: 32 }]}
            >
              <Zap size={48} color="#FFFFFF" />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 12 }}>Analyzing Food...</Text>
              <Text style={{ fontSize: 15, color: '#FFF', opacity: 0.9, marginBottom: 8 }}>Detecting ingredients and allergens</Text>
              {streamingText && (
                <View style={{ backgroundColor: '#FFFFFF22', borderRadius: 12, padding: 8, marginTop: 8 }}>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>{streamingText}</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal visible={showResults} transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={[GlobalStyles.card, { borderRadius: 24, backgroundColor: Colors.card, padding: 24, maxWidth: width * 0.9, maxHeight: height * 0.8 }]}>
              <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} onPress={closeResults}>
                <X size={28} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Method indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {getMethodIcon()}
                <Text style={{ marginLeft: 8, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' }}>
                  {getMethodText()}
                </Text>
              </View>

              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                {!enhancedResults?.allergens || enhancedResults.allergens.length === 0 ? (
                  <CheckCircle size={48} color={Colors.safe} />
                ) : (
                  <AlertTriangle size={48} color={Colors.danger} />
                )}
              </View>

              <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8, textAlign: 'center' }}>
                {!enhancedResults?.allergens || enhancedResults.allergens.length === 0
                  ? 'Safe to Eat!'
                  : 'Allergens Detected!'}
              </Text>

              {enhancedResults?.productName && (
                <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 8, textAlign: 'center' }}>
                  {enhancedResults.productName}
                </Text>
              )}

              {enhancedResults?.allergens && enhancedResults.allergens.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 }}>Detected Allergens:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {enhancedResults.allergens.map((allergen, i) => (
                      <View key={i} style={{ backgroundColor: Colors.danger + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: Colors.danger, fontWeight: '700' }}>{allergen}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {enhancedResults?.ingredients && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 }}>Ingredients:</Text>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 20 }}>
                    {enhancedResults.ingredients}
                  </Text>
                </View>
              )}

              {enhancedResults?.confidence && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, color: Colors.textTertiary, textAlign: 'center' }}>
                    Confidence: {Math.round(enhancedResults.confidence * 100)}%
                  </Text>
                </View>
              )}

              {enhancedResults?.warnings && enhancedResults.warnings.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.warning, marginBottom: 8 }}>Warnings:</Text>
                  {enhancedResults.warnings.map((warning, i) => (
                    <Text key={i} style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 4, fontStyle: 'italic' }}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}

              {/* Firebase AI comparison if available */}
              {scanResults && (
                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 }}>AI Analysis Comparison:</Text>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
                    Food: {scanResults.foodName || 'Unknown'}
                  </Text>
                  {scanResults.allergens.hasAllergens && (
                    <Text style={{ fontSize: 14, color: Colors.danger, fontWeight: '600' }}>
                      AI detected allergens: {scanResults.allergens.detectedAllergens.join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal visible={showBarcodeScanner} animationType="slide">
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onClose={() => setShowBarcodeScanner(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#10B981',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  captureButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F9FAFB',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContainer: {
    paddingHorizontal: 40,
  },
  analyzingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  analyzingText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  allergenSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  allergenItem: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  allergenText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  ingredientSection: {
    marginBottom: 20,
  },
  ingredientText: {
    color: '#6B7280',
    lineHeight: 20,
  },

  confidenceSection: {
    alignItems: 'center',
  },
  confidenceText: {
    color: '#6B7280',
    fontSize: 12,
  },
  streamingContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    maxHeight: 100,
  },
  streamingText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  allergenDescription: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  recommendationSection: {
    marginBottom: 20,
  },
  recommendationItem: {
    marginBottom: 4,
  },
  recommendationText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  safetySection: {
    alignItems: 'center',
    marginTop: 16,
  },
  safetyScore: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personalSection: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  personalRecommendationItem: {
    marginBottom: 4,
  },
  personalRecommendationText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  noFoodContainer: {
    alignItems: 'center',
  },
  noFoodText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});