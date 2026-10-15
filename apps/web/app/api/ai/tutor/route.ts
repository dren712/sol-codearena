import { NextRequest, NextResponse } from 'next/server';
import { CHALLENGES } from '@challenges/data';

export async function POST(req: NextRequest) {
  try {
    const { challengeSlug, userCode, action, errorOutput, question } = await req.json();

    const challenge = CHALLENGES.find((c) => c.slug === challengeSlug);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if external GEMINI_API_KEY or OPENAI_API_KEY is available
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const aiResponse = await callGeminiTutor(geminiKey, challenge, userCode, action, errorOutput, question);
        return NextResponse.json({ answer: aiResponse });
      } catch (e) {
        console.warn('Gemini call failed, falling back to built-in tutor:', e);
      }
    } else if (openaiKey) {
      try {
        const aiResponse = await callOpenAITutor(openaiKey, challenge, userCode, action, errorOutput, question);
        return NextResponse.json({ answer: aiResponse });
      } catch (e) {
        console.warn('OpenAI call failed, falling back to built-in tutor:', e);
      }
    }

    // Built-in pedagogical tutor with domain-specific Solana heuristics
    const response = generatePedagogicalResponse(challenge, userCode, action, errorOutput, question);
    return NextResponse.json({ answer: response });
  } catch (error: any) {
    console.error('AI Tutor error:', error);
    return NextResponse.json(
      { answer: 'I encountered an error analyzing your code. Please check your syntax and try again.' },
      { status: 500 }
    );
  }
}

function generatePedagogicalResponse(
  challenge: any,
  code: string,
  action: string,
  errorOutput?: string,
  question?: string
): string {
  // Flagship Demo Day Challenge: 04-pdas
  if (challenge.slug === '04-pdas') {
    if (action === 'debug-error' || errorOutput) {
      if (code.includes('"users"')) {
        return `💡 Seed Mismatch Detected:\nYour PDA is being derived using the seed \`"users"\`, but the challenge specification requires the singular seed \`"user"\`.\n\nCompare the exact seed string expected by the challenge with the one used in your implementation: \`Buffer.from("user")\`.`;
      }
      if (!code.includes('findProgramAddressSync')) {
        return `💡 Missing Program Address Derivation:\nYou need to call \`PublicKey.findProgramAddressSync([Buffer.from("user"), wallet.toBuffer()], programId)\`.\n\nNotice that this method returns a tuple: \`[pda, bump]\`.`;
      }
      if (!code.includes('wallet.toBuffer()')) {
        return `💡 Seed Encoding:\nMake sure you are converting the wallet's public key to byte buffer using \`wallet.toBuffer()\`. Solana PDAs require raw byte arrays as seeds!`;
      }
    }
    if (action === 'hint') {
      return `💡 Solana PDA Hint:\nRemember the seed order for this challenge:\n1. \`Buffer.from("user")\` (UTF-8 bytes of string prefix)\n2. \`wallet.toBuffer()\` (32-byte representation of public key)\n\nPass these inside an array as the first parameter to \`PublicKey.findProgramAddressSync(seeds, programId)\`.`;
    }
    if (action === 'explain-concept') {
      return `📚 Program Derived Addresses (PDAs):\nPDAs are 32-byte addresses that are deterministically found by hashing seeds and the program ID with a bump byte (255 down to 0) until the resulting 256-bit hash falls *off* the Ed25519 elliptic curve.\n\nBecause they lie off the curve, there is no private key in the universe that can sign for them! Only the designated program ID can sign for the PDA using the \`invoke_signed\` CPI syscall.`;
    }
  }

  // 01-wallets
  if (challenge.slug === '01-wallets') {
    if (action === 'hint') {
      return `💡 Wallets Hint:\n1. Generate the keypair with \`Keypair.generate()\`\n2. Convert the message to bytes using \`new TextEncoder().encode(message)\`\n3. Use \`nacl.sign.detached(bytes, keypair.secretKey)\` to sign\n4. Use \`nacl.sign.detached.verify(bytes, sig, keypair.publicKey.toBytes())\` to verify.`;
    }
    if (action === 'debug-error' && !code.includes('nacl.sign.detached')) {
      return `💡 Signature Primitive Missing:\nYou should use the \`tweetnacl\` detached signing API: \`nacl.sign.detached(messageBytes, keypair.secretKey)\`.`;
    }
  }

  // 02-transactions
  if (challenge.slug === '02-transactions') {
    if (action === 'hint') {
      return `💡 Transaction Assembly:\nCreate \`new Transaction()\`, call \`.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }))\`, and set \`tx.feePayer = fromPubkey\` and \`tx.recentBlockhash = recentBlockhash\`.`;
    }
    if (action === 'debug-error' && !code.includes('feePayer')) {
      return `💡 Fee Payer Notice:\nSolana requires every transaction to designate who pays the signature fees. Don't forget to set \`tx.feePayer = fromPubkey\`!`;
    }
  }

  // 03-accounts
  if (challenge.slug === '03-accounts') {
    if (action === 'hint') {
      return `💡 Account Math:\nRemember that 1 SOL = 1,000,000,000 lamports. You can divide \`accountInfo.lamports / LAMPORTS_PER_SOL\`.\nFor checking owner, use \`accountInfo.owner.equals(SystemProgram.programId)\`.`;
    }
  }

  // 06-anchor
  if (challenge.slug === '06-anchor') {
    if (action === 'hint') {
      return `💡 Discriminator Formula:\nAnchor computes the SHA-256 of \`global:<instruction_name>\` and extracts the first 8 bytes.\nUse \`createHash('sha256').update(\`global:\${instructionName}\`).digest().subarray(0, 8)\`.`;
    }
  }

  // 07-spl-tokens
  if (challenge.slug === '07-spl-tokens') {
    if (action === 'hint') {
      return `💡 Decimal Precision:\nTo convert human amount to base integer units: \`BigInt(Math.round(amountUi * (10 ** decimals)))\`.\nTo reverse: divide \`Number(rawUnits)\` by \`10 ** decimals\`.`;
    }
  }

  // 08-token-accounts
  if (challenge.slug === '08-token-accounts') {
    if (action === 'hint') {
      return `💡 ATA Seeds:\nThe seeds for an Associated Token Account are: \`[wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()]\`, and the deriving program is \`ASSOCIATED_TOKEN_PROGRAM_ID\`!`;
    }
  }

  // Generic fallback based on action
  if (action === 'hint') {
    return `💡 Guide for ${challenge.title}:\nReview the task requirements and look at the provided starter comments. Check that parameter types and return structures strictly match the specification.`;
  }
  if (action === 'explain-concept') {
    const concept = challenge.concepts?.[0];
    return `📚 Concept: ${concept?.title || challenge.title}\n\n${concept?.content || challenge.description}\n\nKey Takeaway: Think in terms of Solana's stateless account architecture and cryptographic immutability.`;
  }
  if (action === 'debug-error') {
    return `🔍 Error Analysis:\n${errorOutput ? `Received output:\n\`\`\`\n${errorOutput}\n\`\`\`\n` : ''}Check that your function return types, parameter order, and variable null-checks match the test suite expectations.`;
  }
  if (action === 'explain-tx') {
    return `⚡ Transaction Lifecycle:\nOn Solana, instructions are bundled into atomic transactions. When submitted to Devnet, validators execute instructions sequentially, verify signature authorization, deduct gas in lamports from feePayer, and commit account state changes.`;
  }

  if (question) {
    return `🤖 Tutor Response:\nRegarding "${question}":\nIn Solana, all state resides in accounts. Keep in mind that programs are stateless code accounts, and PDAs allow programs to control and mutate deterministic data storage without needing a private key.`;
  }

  return `How can I help you learn ${challenge.title}? Choose one of the quick actions (Hint, Explain Concept, Debug Error) or ask a question!`;
}

async function callGeminiTutor(
  apiKey: string,
  challenge: any,
  userCode: string,
  action: string,
  errorOutput?: string,
  question?: string
) {
  const prompt = `You are the AI Tutor for Solana Code Arena.
Challenge: ${challenge.title} (${challenge.category})
Task: ${challenge.task}
Student Code:
\`\`\`typescript
${userCode}
\`\`\`
Error Output: ${errorOutput || 'None'}
User Question/Action: ${action} - ${question || ''}

Instructions:
1. Act as a patient, encouraging senior Solana core developer.
2. Teach the underlying architectural concept (Accounts, PDAs, Transactions, Seeds, Anchor).
3. DO NOT just write the complete solution code for them! Give guided hints, point out discrepancies, and explain why.
4. Keep the answer concise (2-4 paragraphs max).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI tutor';
}

async function callOpenAITutor(
  apiKey: string,
  challenge: any,
  userCode: string,
  action: string,
  errorOutput?: string,
  question?: string
) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are the AI Tutor for Solana Code Arena. Teach Solana concepts without giving away complete code solutions directly.',
        },
        {
          role: 'user',
          content: `Challenge: ${challenge.title}\nTask: ${challenge.task}\nStudent Code:\n${userCode}\nError:\n${errorOutput}\nAction: ${action}\nQuestion: ${question || ''}`,
        },
      ],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response from AI tutor';
}
