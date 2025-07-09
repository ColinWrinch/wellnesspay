import { NextRequest, NextResponse } from 'next/server';
import { mockMccEligibilityList, mockInventoryEligibilityList } from './mockInventoryEligibilityList';
import { ChatGPTTransactionEligibilityEstimator } from './chatGPTTransactionEligibilityEstimator';

/*
-------------------------------------------------------------------------------------------------------------------------------------------------------
API route endpoint to classify transactions as HSA/FSA eligible or not.
This endpoint checks the transaction details against a mock inventory list and a mock MCC (Merchant Category Code) list to determine eligibility.
It returns a JSON response indicating whether the transaction is eligible for HSA/FSA and if it requires a Letter of Medical Necessity (LMN).
This is a mock implementation and should be replaced with actual business logic and data in a production environment
-------------------------------------------------------------------------------------------------------------------------------------------------------
Example Usage:
curl -X POST http://localhost:3000/api/txn-hsa-fsa-classification ^
  -H "Content-Type: application/json" ^
  -d "{\"merchantName\": \"Wellness Pharmacy\", \"txnAmount\": 49.99, \"txnDescription\": \"Blood Pressure Monitor\", \"mcc\": \"5912\", \"sku\": \"1001\", \"upc\": \"10011001\"}"
*/
export async function POST(req: NextRequest) {
  try {

    // Parse the request body to extract transaction details
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }   
    const { merchantName, txnAmount, txnDescription, mcc, sku, upc } = await req.json();
    let eligible = false;
    let needsLmn = false;
    let confidenceScore = 0;
    let rationale = '';
    console.log('Received transaction details:', { merchantName, txnAmount, txnDescription, mcc, sku, upc });

    // First, check if the merchant is eligible based on the MCC, we should only be onboarding merchants that are eligible for HSA/FSA transactions anyways, but this is a safeguard
    if (mcc) {
      const mccEligibility = mockMccEligibilityList.find(item => item.mcc === mcc);
      if (!mccEligibility) {
        return NextResponse.json({ error: 'Merchant not eligible for HSA/FSA transactions' }, { status: 400 });
      }
    }
    
    // Check if the transaction is eligible based on the mock inventory list
    let foundInInventory = false;
    for (const item of mockInventoryEligibilityList) {
      if (item.sku === sku || item.upc === upc) {
        eligible = item.eligible;
        needsLmn = item.needsLmn;
        confidenceScore = 1.0; // Assuming full confidence if a match is found in the eligibility list
        rationale = 'Matched in mock inventory list.';        
        foundInInventory = true;
        console.log('Matched product eligibility:', item);
        break;
      }
    }

    // If not found in inventory, lets use our OpenAI estimator model (o4-mini) to estimate eligibility as a catch-all
    // This is a fallback mechanism to handle products not in the mock inventory list
    if (!foundInInventory) {
      try {
        const chatGPTTransactionEligibilityEstimator = new ChatGPTTransactionEligibilityEstimator();
        const estimate = await chatGPTTransactionEligibilityEstimator.estimateEligibility(sku, upc, mcc, txnDescription);
        eligible = estimate.eligible;
        needsLmn = estimate.needsLmn;
        confidenceScore = estimate.confidenceScore;
        rationale = estimate.rationale;
        console.log('OpenAI eligibility estimate:', estimate);
      } catch (err) {
        console.error('OpenAI eligibility estimation failed:', err);
        return NextResponse.json({ error: 'Eligibility estimation failed', details: String(err) }, { status: 500 });
      }
    }

    // Return the eligibility status response including if an LMN is needed, the confidence score, and rationale which is critical if the transactions is classified with our fall back LLM classification strategy
    console.log('Eligibility check:', { eligible, needsLmn, confidenceScore, rationale }, 'for transaction:', { merchantName, txnAmount, txnDescription, mcc, sku, upc });
    return NextResponse.json({ eligible, needsLmn, confidenceScore, rationale }, { status: 200 });

  } catch (error) {
    console.error('Failed to determine product eligibility:', error);
    return NextResponse.json({ error: 'Failed to determine product eligibility' }, { status: 500 });
  }
}