import { initialData } from '../src/data/initialData.ts';
import {
  saveMenuItemToFirestore,
  deleteMenuItemFromFirestore,
  saveOfferToFirestore,
  deleteOfferFromFirestore,
} from '../src/services/firestoreCatalog.ts';
import { isOfferPubliclyActive, calculateCartDiscount } from '../src/utils/offerUtils.ts';

async function runCatalogTests() {
  console.log('--- STARTING REAL-TIME CATALOG & FIRESTORE INTEGRATION TESTS ---\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Menu Item Creation in Firestore
  console.log('>>> Testing Menu Item Real-time CRUD & Firestore Persistence:');
  const testItemPayload = {
    id: `item_test_${Date.now()}`,
    name: 'Test Gourmet Burger',
    categoryId: 'cat_burger',
    price: 199,
    foodType: 'veg' as const,
    available: true,
    popular: true,
    description: 'Fresh test gourmet burger with cheese sauce',
  };

  let createdItem: any = null;
  try {
    createdItem = await saveMenuItemToFirestore(testItemPayload);
    assert('Creates menu item in Firestore with stable ID', createdItem && createdItem.id === testItemPayload.id);
    assert('Assigns correct price and fields', createdItem.price === 199 && createdItem.foodType === 'veg');
  } catch (e: any) {
    assert('Creates menu item in Firestore without error', false);
  }

  // TEST 2: Menu Item Price & Availability Update
  console.log('\n>>> Testing Menu Item Update (Price & Availability):');
  try {
    const updatedPayload = {
      ...createdItem,
      price: 229,
      available: false,
    };
    const updatedItem = await saveMenuItemToFirestore(updatedPayload);
    assert('Updates menu item price to ₹229', updatedItem.price === 229);
    assert('Updates menu item availability to Sold Out (false)', updatedItem.available === false);
  } catch (e: any) {
    assert('Updates menu item without error', false);
  }

  // TEST 3: Permanent Deletion of Menu Item
  console.log('\n>>> Testing Permanent Deletion of Menu Item:');
  try {
    await deleteMenuItemFromFirestore(testItemPayload.id);
    assert('Executes permanent deleteDoc in Firestore', true);
  } catch (e: any) {
    assert('Executes permanent deleteDoc in Firestore', false);
  }

  // TEST 4: Offers Real-time CRUD, Deactivation & Permanent Deletion
  console.log('\n>>> Testing Offers Real-time CRUD, Deactivation & Cart Discount Calculations:');
  const testOfferPayload = {
    id: `off_test_${Date.now()}`,
    title: 'Flash Festive 20% Discount',
    description: 'Get 20% off on all items',
    offerType: 'percentage' as const,
    discountValue: 20,
    discount: '20% OFF',
    code: 'FLASH20',
    active: true,
    isPublic: true,
    startDate: '2026-01-01T00:00',
    endDate: '2026-12-31T23:59',
  };

  let createdOffer: any = null;
  try {
    createdOffer = await saveOfferToFirestore(testOfferPayload);
    assert('Creates promotional offer document in Firestore', createdOffer && createdOffer.id === testOfferPayload.id);
    assert('Active offer is verified as publicly active', isOfferPubliclyActive(createdOffer) === true);
  } catch (e: any) {
    assert('Creates offer without error', false);
  }

  // Test deactivation
  console.log('\n>>> Testing Offer Deactivation (Stop Applying Discount):');
  try {
    const deactivatedPayload = {
      ...createdOffer,
      active: false,
    };
    const deactivatedOffer = await saveOfferToFirestore(deactivatedPayload);
    assert('Deactivated offer active flag is false', deactivatedOffer.active === false);
    assert('Deactivated offer is rejected by isOfferPubliclyActive()', isOfferPubliclyActive(deactivatedOffer) === false);

    // Cart discount check
    const mockCartItem: any = {
      id: 'cart_1',
      menuItemId: 'item_1',
      name: 'OB Potato Tornado',
      unitPrice: 80,
      quantity: 2,
    };
    const discountCheck = calculateCartDiscount([mockCartItem], deactivatedOffer, []);
    assert('Cart discount calculation rejects deactivated offer', discountCheck.isEligible === false);
  } catch (e: any) {
    assert('Deactivates offer without error', false);
  }

  // Test permanent deletion of offer
  console.log('\n>>> Testing Permanent Offer Deletion:');
  try {
    await deleteOfferFromFirestore(testOfferPayload.id);
    assert('Executes permanent deleteDoc on offer document in Firestore', true);
  } catch (e: any) {
    assert('Executes deleteDoc on offer without error', false);
  }

  // TEST 5: Verification of Initial Menu Integrity & +10 Pricing Rule
  console.log('\n>>> Testing Initial Menu Structure & Rule Verification:');
  const cheeseCornPizza = initialData.menuItems.find(i => i.id === 'item_pizza_cheese_corn');
  assert('OB Cheese Corn Pizza exists in catalog', Boolean(cheeseCornPizza));
  assert('OB Cheese Corn Pizza small variant price is ₹110', cheeseCornPizza?.variants?.[0]?.price === 110);

  const waffleOreo = initialData.menuItems.find(i => i.id === 'item_waffle_oreo_kitkat');
  assert('OB Waffle (Oreo & KitKat) exists in catalog', Boolean(waffleOreo));
  assert('Waffle has 4 required variants', waffleOreo?.variants?.length === 4);

  console.log('\n========================================');
  console.log(`SUMMARY: ${passed} / ${total} tests PASSED`);
  console.log('========================================\n');
}

runCatalogTests();
