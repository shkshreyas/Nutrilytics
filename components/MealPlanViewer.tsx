/**
 * MealPlanViewer Component
 * Displays weekly meal plans with calendar view, expandable meals, and nutrition charts
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MealPlan, Meal, DayPlan } from '@/services/mealPlanService';
import { GlassmorphismCard } from './design-system/GlassmorphismCard';
import { GradientButton } from './design-system/GradientButton';
import { useTheme } from '@/contexts/ThemeContext';
import { colorPalette, gradients } from '@/constants/colors';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');
const DAY_CARD_WIDTH = width * 0.85;

interface MealPlanViewerProps {
    plan: MealPlan;
    onRegenerateMeal: (dayIndex: number, mealType: string) => Promise<void>;
    onSaveFavorite: () => void;
    onShare?: () => void;
}

export const MealPlanViewer: React.FC<MealPlanViewerProps> = ({
    plan,
    onRegenerateMeal,
    onSaveFavorite,
    onShare,
}) => {
    const { isDark, colors } = useTheme();
    const [selectedDay, setSelectedDay] = useState(0);
    const [expandedMeal, setExpandedMeal] = useState<{ dayIndex: number; mealType: string } | null>(null);
    const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const favoriteScale = useRef(new Animated.Value(1)).current;

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleFavoritePress = () => {
        hapticFeedback.medium();
        Animated.sequence([
            Animated.spring(favoriteScale, {
                toValue: 1.3,
                useNativeDriver: true,
                damping: 10,
                mass: 1,
                stiffness: 100,
            }),
            Animated.spring(favoriteScale, {
                toValue: 1,
                useNativeDriver: true,
                damping: 15,
                mass: 1,
                stiffness: 150,
            }),
        ]).start();
        onSaveFavorite();
    };

    const handleRegenerateMeal = async (dayIndex: number, mealType: string) => {
        const mealKey = `${dayIndex}-${mealType}`;
        setRegeneratingMeal(mealKey);
        hapticFeedback.light();
        try {
            await onRegenerateMeal(dayIndex, mealType);
            hapticFeedback.success();
        } catch (error) {
            hapticFeedback.error();
        } finally {
            setRegeneratingMeal(null);
        }
    };

    const getMealIcon = (mealType: string): keyof typeof Ionicons.glyphMap => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            breakfast: 'sunny',
            lunch: 'restaurant',
            dinner: 'moon',
            snack: 'fast-food',
        };
        return icons[mealType] || 'nutrition';
    };

    const getMealGradient = (mealType: string): string[] => {
        const mealGradients: Record<string, string[]> = {
            breakfast: ['#FBBF24', '#F59E0B'],
            lunch: ['#10B981', '#059669'],
            dinner: ['#8B5CF6', '#6366F1'],
            snack: ['#EC4899', '#DB2777'],
        };
        return mealGradients[mealType] || gradients.primary;
    };

    const generateShoppingList = (): string[] => {
        const ingredients = new Set<string>();
        plan.days.forEach((day) => {
            Object.values(day.meals).forEach((meal) => {
                if (meal && meal.ingredients) {
                    meal.ingredients.forEach((ingredient) => ingredients.add(ingredient));
                }
            });
        });
        return Array.from(ingredients).sort();
    };

    const renderDayCard = (day: DayPlan, index: number) => {
        const isSelected = selectedDay === index;
        const dayDate = new Date(day.date);
        const formattedDate = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`;

        return (
            <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => {
                    setSelectedDay(index);
                    hapticFeedback.light();
                }}
            >
                <View style={[styles.dayCard, { width: DAY_CARD_WIDTH }]}>
                    <LinearGradient
                        colors={isSelected ? gradients.primary : ['transparent', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dayCardBorder}
                    >
                        <View style={[styles.dayCardContent, { backgroundColor: colors.card }]}>
                            <Text style={[styles.dayName, { color: colors.textPrimary }]}>
                                {dayNames[index]}
                            </Text>
                            <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                                {formattedDate}
                            </Text>
                            <View style={styles.calorieRing}>
                                <Text style={[styles.calorieText, { color: colors.textPrimary }]}>
                                    {Math.round(day.totalNutrition.calories)}
                                </Text>
                                <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                                    kcal
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        );
    };

    const renderMealCard = (meal: Meal, dayIndex: number, mealType: string) => {
        const mealKey = `${dayIndex}-${mealType}`;
        const isRegenerating = regeneratingMeal === mealKey;

        return (
            <TouchableOpacity
                key={mealType}
                activeOpacity={0.9}
                onPress={() => {
                    setExpandedMeal({ dayIndex, mealType });
                    hapticFeedback.light();
                }}
                style={styles.mealCardContainer}
            >
                <LinearGradient
                    colors={getMealGradient(meal.type)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mealCardGradient}
                >
                    <View style={styles.mealCardContent}>
                        <View style={styles.mealIconContainer}>
                            <Ionicons
                                name={getMealIcon(meal.type)}
                                size={24}
                                color="#FFFFFF"
                            />
                        </View>
                        <View style={styles.mealInfo}>
                            <Text style={styles.mealType}>
                                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                            </Text>
                            <Text style={styles.mealName} numberOfLines={1}>
                                {meal.name}
                            </Text>
                            <View style={styles.macroRow}>
                                <Text style={styles.macroText}>
                                    {Math.round(meal.nutrition.calories)} cal
                                </Text>
                                <Text style={styles.macroText}>•</Text>
                                <Text style={styles.macroText}>
                                    P: {Math.round(meal.nutrition.protein)}g
                                </Text>
                                <Text style={styles.macroText}>•</Text>
                                <Text style={styles.macroText}>
                                    C: {Math.round(meal.nutrition.carbs)}g
                                </Text>
                            </View>
                        </View>
                        {isRegenerating ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                        )}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderExpandedMeal = () => {
        if (!expandedMeal) return null;

        const day = plan.days[expandedMeal.dayIndex];
        const meal = day.meals[expandedMeal.mealType as keyof typeof day.meals];

        if (!meal) return null;

        return (
            <Modal
                visible={true}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setExpandedMeal(null)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <LinearGradient
                        colors={getMealGradient(meal.type)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <TouchableOpacity
                            onPress={() => setExpandedMeal(null)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderContent}>
                            <Ionicons
                                name={getMealIcon(meal.type)}
                                size={48}
                                color="#FFFFFF"
                            />
                            <Text style={styles.modalMealName}>{meal.name}</Text>
                            <Text style={styles.modalMealType}>
                                {expandedMeal.mealType.charAt(0).toUpperCase() + expandedMeal.mealType.slice(1)}
                            </Text>
                            <View style={styles.modalMetaRow}>
                                <View style={styles.modalMetaItem}>
                                    <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                                    <Text style={styles.modalMetaText}>{meal.prepTime} min</Text>
                                </View>
                                <View style={styles.modalMetaItem}>
                                    <Ionicons name="restaurant-outline" size={16} color="#FFFFFF" />
                                    <Text style={styles.modalMetaText}>{meal.cuisine}</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

                        {/* Nutrition Facts */}
                        <GlassmorphismCard style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                Nutrition Facts
                            </Text>
                            <View style={styles.nutritionGrid}>
                                <View style={styles.nutritionItem}>
                                    <LinearGradient
                                        colors={['#F59E0B', '#EF4444']}
                                        style={styles.nutritionCircle}
                                    >
                                        <Text style={styles.nutritionValue}>
                                            {Math.round(meal.nutrition.calories)}
                                        </Text>
                                    </LinearGradient>
                                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                                        Calories
                                    </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <LinearGradient
                                        colors={['#3B82F6', '#8B5CF6']}
                                        style={styles.nutritionCircle}
                                    >
                                        <Text style={styles.nutritionValue}>
                                            {Math.round(meal.nutrition.protein)}g
                                        </Text>
                                    </LinearGradient>
                                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                                        Protein
                                    </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <LinearGradient
                                        colors={['#10B981', '#06B6D4']}
                                        style={styles.nutritionCircle}
                                    >
                                        <Text style={styles.nutritionValue}>
                                            {Math.round(meal.nutrition.carbs)}g
                                        </Text>
                                    </LinearGradient>
                                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                                        Carbs
                                    </Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                    <LinearGradient
                                        colors={['#EC4899', '#F59E0B']}
                                        style={styles.nutritionCircle}
                                    >
                                        <Text style={styles.nutritionValue}>
                                            {Math.round(meal.nutrition.fat)}g
                                        </Text>
                                    </LinearGradient>
                                    <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>
                                        Fat
                                    </Text>
                                </View>
                            </View>
                        </GlassmorphismCard>

                        {/* Ingredients */}
                        <GlassmorphismCard style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                Ingredients
                            </Text>
                            {meal.ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientRow}>
                                    <View style={styles.ingredientBullet}>
                                        <LinearGradient
                                            colors={gradients.primary}
                                            style={styles.bulletGradient}
                                        />
                                    </View>
                                    <Text style={[styles.ingredientText, { color: colors.textPrimary }]}>
                                        {ingredient}
                                    </Text>
                                </View>
                            ))}
                        </GlassmorphismCard>

                        {/* Instructions */}
                        <GlassmorphismCard style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                Instructions
                            </Text>
                            {meal.instructions.map((instruction, index) => (
                                <View key={index} style={styles.instructionRow}>
                                    <LinearGradient
                                        colors={gradients.secondary}
                                        style={styles.stepNumber}
                                    >
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </LinearGradient>
                                    <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
                                        {instruction}
                                    </Text>
                                </View>
                            ))}
                        </GlassmorphismCard>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <GradientButton
                                title="Regenerate This Meal"
                                onPress={() => {
                                    setExpandedMeal(null);
                                    handleRegenerateMeal(expandedMeal.dayIndex, expandedMeal.mealType);
                                }}
                                variant="secondary"
                                size="medium"
                                fullWidth
                                style={styles.actionButton}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    const renderShoppingList = () => {
        const ingredients = generateShoppingList();

        return (
            <Modal
                visible={showShoppingList}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowShoppingList(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <LinearGradient
                        colors={gradients.secondary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.modalHeader}
                    >
                        <TouchableOpacity
                            onPress={() => setShowShoppingList(false)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.modalHeaderContent}>
                            <Ionicons name="cart" size={48} color="#FFFFFF" />
                            <Text style={styles.modalMealName}>Shopping List</Text>
                            <Text style={styles.modalMealType}>
                                {ingredients.length} ingredients for this week
                            </Text>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        <GlassmorphismCard style={styles.section}>
                            {ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.shoppingListItem}>
                                    <View style={styles.checkbox}>
                                        <LinearGradient
                                            colors={gradients.primary}
                                            style={styles.checkboxGradient}
                                        />
                                    </View>
                                    <Text style={[styles.shoppingListText, { color: colors.textPrimary }]}>
                                        {ingredient}
                                    </Text>
                                </View>
                            ))}
                        </GlassmorphismCard>

                        <View style={styles.actionButtons}>
                            {onShare && (
                                <GradientButton
                                    title="Share List"
                                    onPress={() => {
                                        setShowShoppingList(false);
                                        onShare();
                                    }}
                                    variant="primary"
                                    size="medium"
                                    fullWidth
                                />
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Your Personalized Meal Plan</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={handleFavoritePress}
                        style={styles.headerButton}
                    >
                        <Animated.View style={{ transform: [{ scale: favoriteScale }] }}>
                            <Ionicons
                                name={plan.isFavorite ? 'heart' : 'heart-outline'}
                                size={28}
                                color="#FFFFFF"
                            />
                        </Animated.View>
                    </TouchableOpacity>
                    {onShare && (
                        <TouchableOpacity
                            onPress={onShare}
                            style={styles.headerButton}
                        >
                            <Ionicons name="share-outline" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {/* Week Selector */}
            <View style={styles.weekSelector}>
                <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>
                    Week of {new Date(plan.weekOf).toLocaleDateString()}
                </Text>
            </View>

            {/* Day Cards Carousel */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={DAY_CARD_WIDTH + 20}
                decelerationRate="fast"
                contentContainerStyle={styles.dayCardsContainer}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / (DAY_CARD_WIDTH + 20));
                    setSelectedDay(index);
                }}
            >
                {plan.days.map((day, index) => renderDayCard(day, index))}
            </ScrollView>

            {/* Meals List */}
            <ScrollView style={styles.mealsContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.mealsContent}>
                    {plan.days[selectedDay] && (
                        <>
                            {Object.entries(plan.days[selectedDay].meals).map(([mealType, meal]) =>
                                meal ? renderMealCard(meal, selectedDay, mealType) : null
                            )}
                        </>
                    )}

                    {/* Shopping List Button */}
                    <GradientButton
                        title="View Shopping List"
                        onPress={() => {
                            setShowShoppingList(true);
                            hapticFeedback.light();
                        }}
                        variant="secondary"
                        size="large"
                        fullWidth
                        style={styles.shoppingListButton}
                    />
                </View>
            </ScrollView>

            {/* Modals */}
            {renderExpandedMeal()}
            {renderShoppingList()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        padding: 8,
    },
    weekSelector: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    weekLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    dayCardsContainer: {
        paddingHorizontal: (width - DAY_CARD_WIDTH) / 2,
        paddingVertical: 16,
        gap: 20,
    },
    dayCard: {
        marginHorizontal: 10,
    },
    dayCardBorder: {
        borderRadius: 20,
        padding: 3,
    },
    dayCardContent: {
        borderRadius: 17,
        padding: 20,
        alignItems: 'center',
    },
    dayName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    dayDate: {
        fontSize: 14,
        marginBottom: 16,
    },
    calorieRing: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: colorPalette.primary.start,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calorieText: {
        fontSize: 24,
        fontWeight: '700',
    },
    calorieLabel: {
        fontSize: 12,
    },
    mealsContainer: {
        flex: 1,
    },
    mealsContent: {
        padding: 20,
        paddingBottom: 40,
    },
    mealCardContainer: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    mealCardGradient: {
        padding: 16,
    },
    mealCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    mealInfo: {
        flex: 1,
    },
    mealType: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        opacity: 0.8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mealName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
        marginBottom: 4,
    },
    macroRow: {
        flexDirection: 'row',
        gap: 8,
    },
    macroText: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    shoppingListButton: {
        marginTop: 24,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    modalHeaderContent: {
        alignItems: 'center',
    },
    modalMealName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 16,
        textAlign: 'center',
    },
    modalMealType: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalMetaRow: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 12,
    },
    modalMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalMetaText: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    nutritionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 16,
    },
    nutritionItem: {
        alignItems: 'center',
    },
    nutritionCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    nutritionValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    nutritionLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ingredientBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
        overflow: 'hidden',
    },
    bulletGradient: {
        width: '100%',
        height: '100%',
    },
    ingredientText: {
        fontSize: 16,
        flex: 1,
    },
    instructionRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    instructionText: {
        fontSize: 16,
        flex: 1,
        lineHeight: 24,
    },
    actionButtons: {
        marginTop: 8,
        marginBottom: 20,
    },
    actionButton: {
        marginBottom: 12,
    },
    shoppingListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(100, 116, 139, 0.1)',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 12,
        overflow: 'hidden',
    },
    checkboxGradient: {
        width: '100%',
        height: '100%',
    },
    shoppingListText: {
        fontSize: 16,
        flex: 1,
    },
});
