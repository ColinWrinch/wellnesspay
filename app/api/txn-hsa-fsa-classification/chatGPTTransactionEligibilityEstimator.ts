import { AzureOpenAI } from 'openai';

/*
 * Utility class to estimate HSA/FSA eligibility using Azure OpenAI o-series reasoning model as a catch all for products not found in the mock inventory list.
 * This class uses the o4-mini reasoning model hosted and deployed on Azure OpenAI Foundry to analyze product details
 */
export class ChatGPTTransactionEligibilityEstimator {
  private openai: AzureOpenAI;
  private deployment: string;

  constructor() {
    // Hardcoded Azure OpenAI details for toy project, not for production use, would be replaced with environment variables in a real application
    const apiKey = "C5JOUi6vdVgBsAdR1MjNtsbIQRe86k5p6cxgud1dr67mtnqWzPXnJQQJ99ALAC4f1cMXJ3w3AAABACOG40L4";  // Note this key will be rotated in 5 days
    const endpoint = 'https://revidera-openai.openai.azure.com/';
    const deployment = 'o4-mini';
    const apiVersion = '2024-12-01-preview';
    this.openai = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion });
    this.deployment = deployment;
  }

  /**
   * Estimate eligibility and confidence for a product using Azure OpenAI hosted model (o4-mini reasoning model)
   * @param sku Product SKU
   * @param upc Product UPC
   * @param mcc Merchant Category Code
   * @param txnDescription Transaction description provided by the merchant
   * @returns {Promise<{eligible: boolean, needsLmn: boolean, confidenceScore: number, rationale: string}>}
   */
  async estimateEligibility(sku: string, upc: string, mcc: string, txnDescription: string): Promise<{
    eligible: boolean;
    needsLmn: boolean;
    confidenceScore: number;
    rationale: string;
  }> {

    // System and user prompts for the OpenAI completions api
    const systemPrompt = `You are an expert in HSA/FSA product eligibility that analyzes medical and wellness transactions by reviewing mcc code, upc code, sku numbers, and transaction descriptions to determine step by step if the transaction is eligible for HSA/FSA reimbursement. 
        When providing a confidenceScore, use the following guidelines:
        - 0.9 to 1.0: The product is clearly eligible or ineligible based on well-known HSA/FSA rules or is a common medical/healthcare item.
        - 0.7 to 0.89: The product is likely eligible/ineligible, but there is some ambiguity or it is less common.
        - 0.4 to 0.69: The product is uncommon or there is significant ambiguity, but some evidence exists for eligibility/ineligibility.
        - 0.0 to 0.39: There is little to no evidence for eligibility/ineligibility, or the product is unrelated to HSA/FSA categories.
        Always provide a rationale for your decision and confidence score.`;
    const userPrompt = `A customer is attempting to purchase a product with the following details:\nSKU: ${sku}\nUPC: ${upc}\nMerchant Category Code (MCC): ${mcc}\nTransaction Description: ${txnDescription}.\nIs this product likely to be eligible for HSA/FSA reimbursement?\nRespond with a JSON object with keys: eligible (boolean), needsLmn (boolean), confidenceScore (0-1 float), and rationale (string).`;

    // Call the OpenAI completions API with the system and user prompts to attempt to classify the transaction
    const response = await this.openai.chat.completions.create({
      model: this.deployment,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' }, // Enable JSON mode for structured output
    });

    // Parse the first response as JSON
    const content = response.choices[0]?.message?.content || '';
    try {
      const result = JSON.parse(content);
      return {
        eligible: !!result.eligible,
        needsLmn: !!result.needsLmn,
        confidenceScore: typeof result.confidenceScore === 'number' ? result.confidenceScore : 0,
        rationale: result.rationale || '',
      };
    } catch {
      throw new Error('Failed to parse OpenAI response: ' + content);
    }
  }
}
