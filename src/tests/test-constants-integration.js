/**
 * Test d'intégration: Vérifier que les constantes sont accessibles
 * dans le frontend Vue comme prévu.
 * 
 * À exécuter dans: src/App.vue ou un composant test
 * 
 * Usage:
 *   import testConstants from '@/tests/test-constants-integration'
 *   onMounted(() => testConstants())
 */

export default function testConstantsIntegration() {
  try {
    // Importe comme en production
    const { COCKTAIL_CONSTANTS } = require('@/lib/cocktail-constants')
    
    console.group('✅ TEST INTÉGRATION CONSTANTES')
    
    // Test 1: Vérifier les ingrédients
    const ingredientCount = Object.keys(COCKTAIL_CONSTANTS.INGREDIENTS).length
    console.log(`📊 Ingrédients chargés: ${ingredientCount}`)
    if (ingredientCount === 0) throw new Error('Aucun ingrédient!')
    if (ingredientCount < 80) console.warn(`⚠️ Nombre d'ingrédients faible: ${ingredientCount}`)
    
    // Test 2: Vérifier les verres
    const glassCount = Object.keys(COCKTAIL_CONSTANTS.GLASSES).length
    console.log(`🥃 Verres chargés: ${glassCount}`)
    if (glassCount === 0) throw new Error('Aucun verre!')
    
    // Test 3: Vérifier les méthodes
    const methodCount = Object.keys(COCKTAIL_CONSTANTS.METHODS).length
    console.log(`🍸 Méthodes chargées: ${methodCount}`)
    if (methodCount === 0) throw new Error('Aucune méthode!')
    
    // Test 4: Vérifier les glaçons
    const iceCount = Object.keys(COCKTAIL_CONSTANTS.ICE_TYPES).length
    console.log(`🧊 Types de glaçons: ${iceCount}`)
    if (iceCount === 0) throw new Error('Aucun type de glaçon!')
    
    // Test 5: Vérifier les profils
    const profileCount = Object.keys(COCKTAIL_CONSTANTS.PROFILES).length
    console.log(`🎯 Profils chargés: ${profileCount}`)
    if (profileCount === 0) throw new Error('Aucun profil!')
    
    // Test 6: Vérifier les arrays pour chips
    const profilesArray = COCKTAIL_CONSTANTS.PROFILES_ARRAY.length
    console.log(`📋 Profils en array (pour v-for): ${profilesArray}`)
    if (profilesArray !== profileCount) {
      console.warn(`⚠️ Mismatch: ${profileCount} profils vs ${profilesArray} en array`)
    }
    
    // Test 7: Vérifier les options pour select
    const glassOptions = COCKTAIL_CONSTANTS.GLASSES_OPTIONS.length
    const methodOptions = COCKTAIL_CONSTANTS.METHODS_OPTIONS.length
    console.log(`📝 Verres options (select): ${glassOptions}`)
    console.log(`📝 Méthodes options (select): ${methodOptions}`)
    
    // Test 8: Vérifier un ingrédient spécifique
    const bourbon = COCKTAIL_CONSTANTS.INGREDIENTS.bourbon
    if (!bourbon) {
      throw new Error('Bourbon not found!')
    }
    console.log(`✅ Ingredient test - Bourbon: ${bourbon.name} (${bourbon.abv}% ABV)`)
    
    // Test 9: Vérifier un verre spécifique
    const rockGlass = COCKTAIL_CONSTANTS.GLASSES.rocks
    if (!rockGlass) {
      throw new Error('Rocks glass not found!')
    }
    console.log(`✅ Glass test - Rocks: ${rockGlass.emoji} ${rockGlass.name}`)
    
    // Test 10: Vérifier cohérence du scraper Python
    console.log(`\n🔄 VÉRIFICATION COHÉRENCE SCRAPER:`)
    console.log(`   Assurer que le Scraper charge EXACTEMENT:`)
    console.log(`   - ${ingredientCount} ingrédients (mettre à jour le test Python si différent)`)
    console.log(`   - ${glassCount} verres`)
    console.log(`   - ${methodCount} méthodes`)
    console.log(`   - ${iceCount} types de glaçons`)
    
    console.log('\n✅ TOUS LES TESTS PASSÉS!')
    console.groupEnd()
    
    return {
      success: true,
      stats: {
        ingredients: ingredientCount,
        glasses: glassCount,
        methods: methodCount,
        iceTypes: iceCount,
        profiles: profileCount,
        seasons: Object.keys(COCKTAIL_CONSTANTS.SEASONS).length,
        styles: COCKTAIL_CONSTANTS.COCKTAIL_STYLES.length,
      }
    }
    
  } catch (error) {
    console.error('❌ ERREUR TEST CONSTANTES:', error.message)
    console.groupEnd()
    return { success: false, error: error.message }
  }
}

/**
 * Alternative: test avec import ES6
 */
export async function testConstantsES6() {
  try {
    const { getAllIngredients, getGlasses, getMethods } = await import('@/lib/cocktail-constants')
    
    const ingredients = getAllIngredients()
    const glasses = getGlasses()
    const methods = getMethods()
    
    console.log('✅ ES6 Test:')
    console.log(`   Ingrédients: ${Object.keys(ingredients).length}`)
    console.log(`   Verres: ${Object.keys(glasses).length}`)
    console.log(`   Méthodes: ${Object.keys(methods).length}`)
    
    return true
  } catch (error) {
    console.error('❌ ES6 Import error:', error)
    return false
  }
}
