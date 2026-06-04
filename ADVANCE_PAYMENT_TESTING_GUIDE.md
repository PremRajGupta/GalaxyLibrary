/**
 * Advance Payment Testing Guide - Local Development
 * 
 * How to test the advance payment system locally
 */

// ============================================
// STEP 1: TEST DATA SETUP
// ============================================

/**
 * First, create a test student (via UI or API)
 * 
 * Sample Student Data:
 * {
 *   name: "Test Student",
 *   fatherName: "Test Father",
 *   mobile: "9876543210",
 *   email: "test@example.com",
 *   address: "Test Address",
 *   course: "course1",
 *   timeShift: "8hours",
 *   feeAmount: 500,
 *   joiningDate: "2024-06-04"
 * }
 */

// ============================================
// STEP 2: CREATE A PAYMENT (via FeeCollection UI)
// ============================================

/**
 * Steps to create payment in UI:
 * 1. Go to FeeCollection page
 * 2. Search for your test student
 * 3. Click on student name to open payment modal
 * 4. Enter amount: 1500 (₹ 1500 advance)
 * 5. Select month: "2024-06" or any month
 * 6. Payment Mode: "cash"
 * 7. Click "Pay Amount" button
 * 8. Payment saved! You get receipt ID
 */

// ============================================
// STEP 3: TEST API DIRECTLY WITH CURL/POSTMAN
// ============================================

/**
 * OPTION A: Using Postman (Recommended for GUI)
 * 
 * 1. Create Payment:
 *    POST http://localhost:5000/api/fees
 *    Body:
 *    {
 *      "studentDisplayId": "STU1234",
 *      "amount": 1500,
 *      "month": "2024-06",
 *      "paymentMode": "cash",
 *      "notes": "Advance payment test"
 *    }
 *    Response: { _id, receiptNumber, ... }
 *    Copy the _id or receiptNumber
 * 
 * 2. Mark as Advance Payment:
 *    POST http://localhost:5000/api/fees/{_id}/mark-advance
 *    Body:
 *    {
 *      "monthlyFee": 500,
 *      "advanceStartDate": "2024-06-04",
 *      "isAdvance": true
 *    }
 *    Response: Shows updated fee with validity info
 * 
 * 3. Get Student Payment Validity:
 *    GET http://localhost:5000/api/fees/student/STU1234/validity
 *    Response: Shows complete validity information
 */

/**
 * OPTION B: Using cURL commands (Terminal)
 * 
 * 1. Create Payment:
 *    curl -X POST http://localhost:5000/api/fees \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "studentDisplayId": "STU1234",
 *        "amount": 1500,
 *        "month": "2024-06",
 *        "paymentMode": "cash",
 *        "notes": "Advance payment test"
 *      }'
 *    
 *    Response will include: _id
 *    Copy this _id for next step
 * 
 * 2. Mark as Advance:
 *    curl -X POST http://localhost:5000/api/fees/{_id}/mark-advance \
 *      -H "Content-Type: application/json" \
 *      -d '{
 *        "monthlyFee": 500,
 *        "advanceStartDate": "2024-06-04",
 *        "isAdvance": true
 *      }'
 * 
 * 3. Get Validity:
 *    curl -X GET http://localhost:5000/api/fees/student/STU1234/validity
 */

// ============================================
// STEP 4: UNDERSTAND THE OUTPUT
// ============================================

/**
 * Mark as Advance Response:
 * {
 *   "_id": "507f1f77bcf86cd799439011",
 *   "studentDisplayId": "STU1234",
 *   "amount": 1500,
 *   "isAdvancePayment": true,
 *   "monthlyFee": 500,
 *   "monthsCovered": 3,
 *   "validUntilDate": "2024-09-04T00:00:00.000Z",
 *   "advanceStartDate": "2024-06-04T00:00:00.000Z",
 *   "receiptNumber": "GalaxyPR240601"
 * }
 * 
 * Explanation:
 * - monthsCovered: 1500 / 500 = 3 months ✓
 * - validUntilDate: 2024-06-04 + 3 months = 2024-09-04 ✓
 */

/**
 * Get Student Validity Response:
 * {
 *   "hasAdvancePayment": true,
 *   "monthsCovered": 3,
 *   "validUntilDate": "2024-09-04",
 *   "daysRemaining": 92,
 *   "paymentStatus": "valid",
 *   "receiptNumber": "GalaxyPR240601",
 *   "amount": 1500,
 *   "paymentDate": "2024-06-04"
 * }
 * 
 * Explanation:
 * - paymentStatus: "valid" (GREEN badge) ✓
 * - daysRemaining: 92 days ✓
 * - validUntilDate: 04 Sep 2024 ✓
 */

// ============================================
// STEP 5: TEST DIFFERENT SCENARIOS
// ============================================

/**
 * Scenario 1: VALID PAYMENT (Green Badge)
 * 
 * Payment Date: 2024-06-04
 * Amount: 1500
 * Monthly Fee: 500
 * Today: Any day before 2024-09-04
 * 
 * Expected:
 * - paymentStatus: "valid"
 * - daysRemaining: > 0
 * - Badge: GREEN
 */

/**
 * Scenario 2: EXPIRING SOON (Yellow Badge)
 * 
 * Payment Date: 2024-06-04
 * Amount: 1500
 * Monthly Fee: 500
 * Valid Until: 2024-09-04
 * Today: 2024-08-20 (15 days before)
 * 
 * Expected:
 * - paymentStatus: "expiring-soon"
 * - daysRemaining: 15
 * - Badge: YELLOW
 */

/**
 * Scenario 3: EXPIRED (Red Badge)
 * 
 * Payment Date: 2024-06-04
 * Amount: 1500
 * Monthly Fee: 500
 * Valid Until: 2024-09-04
 * Today: 2024-09-10 (after validity)
 * 
 * Expected:
 * - paymentStatus: "expired"
 * - daysRemaining: 0
 * - Badge: RED
 */

// ============================================
// STEP 6: TEST WITH DIFFERENT AMOUNTS
// ============================================

/**
 * Test Case 1: Half Month Advance
 * 
 * Amount: 250
 * Monthly Fee: 500
 * 
 * Result:
 * monthsCovered: 0 (floor(250/500) = 0)
 * Note: System rounds down - 0 months means no validity
 */

/**
 * Test Case 2: Exact Month
 * 
 * Amount: 500
 * Monthly Fee: 500
 * 
 * Result:
 * monthsCovered: 1
 * Valid for exactly 1 month
 */

/**
 * Test Case 3: Multiple Months
 * 
 * Amount: 3500
 * Monthly Fee: 500
 * 
 * Result:
 * monthsCovered: 7
 * Valid for 7 months (3500 / 500 = 7)
 */

/**
 * Test Case 4: Partial + Full Months
 * 
 * Amount: 1750
 * Monthly Fee: 500
 * 
 * Result:
 * monthsCovered: 3 (floor(1750/500) = 3)
 * Remaining: 250 (leftover)
 * Valid for 3 complete months
 */

// ============================================
// STEP 7: DATABASE VERIFICATION
// ============================================

/**
 * Connect to MongoDB directly (MongoDB Compass or Shell)
 * 
 * 1. Find the Fee document:
 *    db.fees.findOne({ 
 *      studentDisplayId: "STU1234",
 *      isAdvancePayment: true 
 *    })
 * 
 * 2. Check fields:
 *    {
 *      _id: ObjectId("..."),
 *      studentDisplayId: "STU1234",
 *      amount: 1500,
 *      monthlyFee: 500,
 *      monthsCovered: 3,
 *      validUntilDate: ISODate("2024-09-04T00:00:00Z"),
 *      advanceStartDate: ISODate("2024-06-04T00:00:00Z"),
 *      isAdvancePayment: true
 *    }
 * 
 * 3. Verify calculation:
 *    monthsCovered should be: floor(amount / monthlyFee)
 */

// ============================================
// STEP 8: FRONTEND COMPONENT TEST
// ============================================

/**
 * Once you have a valid advance payment, test UI:
 * 
 * 1. Pass data to AdvancePaymentCard component:
 *    <AdvancePaymentCard
 *      studentId="STU1234"
 *      studentName="Test Student"
 *      monthlyFee={500}
 *      advanceAmount={1500}
 *      joiningDate="2024-06-04"
 *    />
 * 
 * 2. Expected UI Output:
 *    - "Months Covered": 3
 *    - "Amount Paid": ₹1500
 *    - "Valid Until": 04 Sep 2024
 *    - "Days Remaining": 92
 *    - Status Badge: GREEN ✓
 * 
 * 3. Check colors:
 *    - Green: Valid payment ✓
 *    - Yellow: Expiring soon ⚠
 *    - Red: Expired ✗
 */

// ============================================
// STEP 9: COMMON ISSUES & FIXES
// ============================================

/**
 * Issue 1: "Student not found with provided ID"
 * Fix: Ensure student exists and studentDisplayId is correct
 * Check: Go to StudentRecords to see correct student ID
 * 
 * Issue 2: monthsCovered is 0
 * Fix: Amount must be >= monthlyFee
 * Example: 500 amount for 500 fee = 1 month (OK)
 * Example: 250 amount for 500 fee = 0 months (NOT OK)
 * 
 * Issue 3: validUntilDate calculation wrong
 * Fix: Check advanceStartDate format - must be ISO (YYYY-MM-DD)
 * Example: "2024-06-04" ✓
 * Example: "06-04-2024" ✗
 * 
 * Issue 4: daysRemaining calculation off
 * Fix: Server uses current server date/time
 * If mismatch: Check server timezone
 * Verify: Date.now() on server vs local
 */

// ============================================
// STEP 10: QUICK TEST CHECKLIST
// ============================================

/**
 * Pre-Testing:
 * ☐ Backend running on port 5000
 * ☐ MongoDB connected
 * ☐ Frontend running on port 5173
 * ☐ Student created with fee amount
 * 
 * Testing Payment Creation:
 * ☐ Create payment via UI or API
 * ☐ Payment saved in database
 * ☐ Receipt number generated
 * ☐ Payment visible in FeeCollection
 * 
 * Testing Advance Marking:
 * ☐ Mark payment as advance
 * ☐ No errors in API response
 * ☐ monthsCovered calculated correctly
 * ☐ validUntilDate set correctly
 * ☐ Database shows new fields
 * 
 * Testing Validity API:
 * ☐ GET /api/fees/student/{id}/validity works
 * ☐ Returns correct months covered
 * ☐ Returns correct days remaining
 * ☐ paymentStatus is "valid"
 * 
 * Testing UI Component:
 * ☐ AdvancePaymentCard renders
 * ☐ Shows correct months
 * ☐ Shows correct date
 * ☐ Shows correct days
 * ☐ Status badge visible
 * ☐ Status color correct
 * 
 * Testing Edge Cases:
 * ☐ Half month advance (0 months)
 * ☐ Multiple months advance
 * ☐ Different time shifts
 * ☐ Different fee amounts
 */

// ============================================
// SAMPLE TEST SCRIPT (Node.js)
// ============================================

/**
 * Create file: test-advance-payment.js
 * Run: node test-advance-payment.js
 * 
 * Requirements: axios, dotenv
 * npm install axios dotenv
 */

/*
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAdvancePayment() {
  try {
    console.log('1. Creating test payment...');
    const paymentRes = await axios.post(`${API_URL}/fees`, {
      studentDisplayId: 'STU1234',
      amount: 1500,
      month: '2024-06',
      paymentMode: 'cash',
      notes: 'Test advance payment'
    });
    
    const paymentId = paymentRes.data._id;
    console.log('✓ Payment created:', paymentRes.data.receiptNumber);
    
    console.log('\n2. Marking as advance...');
    const advanceRes = await axios.post(
      `${API_URL}/fees/${paymentId}/mark-advance`,
      {
        monthlyFee: 500,
        advanceStartDate: '2024-06-04',
        isAdvance: true
      }
    );
    
    console.log('✓ Marked as advance');
    console.log('  Months covered:', advanceRes.data.monthsCovered);
    console.log('  Valid until:', advanceRes.data.validUntilDate);
    
    console.log('\n3. Getting validity info...');
    const validityRes = await axios.get(
      `${API_URL}/fees/student/STU1234/validity`
    );
    
    console.log('✓ Validity info retrieved');
    console.log('  Status:', validityRes.data.paymentStatus);
    console.log('  Days remaining:', validityRes.data.daysRemaining);
    console.log('  Valid until:', validityRes.data.validUntilDate);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAdvancePayment();
*/

// ============================================
// EXPECTED OUTPUTS
// ============================================

/**
 * Successful Test Output:
 * 
 * 1. Creating test payment...
 * ✓ Payment created: GalaxyPR240601
 * 
 * 2. Marking as advance...
 * ✓ Marked as advance
 *   Months covered: 3
 *   Valid until: 2024-09-04T00:00:00.000Z
 * 
 * 3. Getting validity info...
 * ✓ Validity info retrieved
 *   Status: valid
 *   Days remaining: 92
 *   Valid until: 2024-09-04
 * 
 * ✅ All tests passed!
 */

// ============================================
// TROUBLESHOOTING
// ============================================

/**
 * If tests fail:
 * 
 * 1. Check backend console for errors
 * 2. Verify MongoDB connection
 * 3. Check if Fee model has new fields
 * 4. Verify student exists in database
 * 5. Check API response for error messages
 * 6. Look at server logs for validation errors
 * 
 * Common Errors:
 * - "Student not found" → Student ID doesn't exist
 * - "Valid monthly fee is required" → monthlyFee missing or <= 0
 * - "Cannot read property 'name'" → Student object structure wrong
 */

export {};
