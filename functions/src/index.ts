import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

const huggingfaceApiKey = defineSecret('HUGGINGFACE_API_KEY');
const deepseekApiKey = defineSecret('DEEPSEEK_API_KEY');

const app = initializeApp();

function db() {
  return getFirestore(app);
}

// Callable: activate a key (server-side, safe)
export const activateKey = onCall(async (request) => {
  const { key } = request.data;
  if (!key) throw new HttpsError('invalid-argument', 'Key is required');

  const keysRef = db().collection('keys');
  const q = await keysRef.where('key', '==', key).limit(1).get();
  if (q.empty) throw new HttpsError('not-found', 'Key not found');

  const keyDoc = q.docs[0];
  if (keyDoc.data().used) throw new HttpsError('failed-precondition', 'Key already used');

  await db().runTransaction(async (tx) => {
    const kRef = keysRef.doc(keyDoc.id);
    const fresh = await tx.get(kRef);
    if (!fresh.exists || fresh.data()?.used) {
      throw new HttpsError('failed-precondition', 'Key already used');
    }
    tx.update(kRef, { used: true, usedAt: FieldValue.serverTimestamp() });
    tx.set(db().collection('key_audit').doc(), {
      key, event: 'activated', timestamp: FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});

// Callable: generate key (admin only)
export const generateKey = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Only admin can generate keys');
  }

  const key = `KEY-${db().collection('_').doc().id.toUpperCase().slice(0, 12)}`;
  await db().collection('keys').add({
    key,
    createdAt: FieldValue.serverTimestamp(),
    used: false,
    role: 'user',
  });
  return { key };
});

// Callable: list keys (admin only)
export const listKeys = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Only admin can list keys');
  }

  const docs = await db().collection('keys').orderBy('createdAt', 'desc').get();
  const items = docs.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { items };
});

// Callable: deactivate/delete a key (admin only)
export const deactivateKey = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Only admin can delete keys');
  }

  const { id } = request.data;
  if (!id) throw new HttpsError('invalid-argument', 'Key id is required');

  await db().collection('keys').doc(id).delete();
  await db().collection('key_audit').add({
    keyId: id, event: 'deleted', by: request.auth!.uid,
    timestamp: FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// Callable: proxy AI generation (Hugging Face or DeepSeek)
export const aiGenerate = onCall(
  { secrets: [huggingfaceApiKey, deepseekApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { provider, model, prompt } = request.data as {
      provider: 'huggingface' | 'deepseek';
      model?: string;
      prompt: string;
    };

    if (!provider) throw new HttpsError('invalid-argument', 'Provider is required');
    if (!prompt) throw new HttpsError('invalid-argument', 'Prompt is required');

    if (provider === 'huggingface') {
      const apiKey = huggingfaceApiKey.value();
      const hfModel = model || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${hfModel}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );
      if (!response.ok) {
        throw new HttpsError('internal', `Hugging Face API error: ${response.statusText}`);
      }
      const data = await response.json() as { generated_text?: string }[] | { generated_text?: string };
      const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
      if (text === undefined) {
        console.warn('Unexpected Hugging Face response structure:', JSON.stringify(data));
      }
      return { text: text ?? '' };
    }

    if (provider === 'deepseek') {
      const apiKey = deepseekApiKey.value();
      const dsModel = model || 'deepseek-chat';
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: dsModel,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) {
        throw new HttpsError('internal', `DeepSeek API error: ${response.statusText}`);
      }
      const data = await response.json() as { choices?: { message?: { content?: string } }[] };
      const text = data.choices?.[0]?.message?.content;
      if (text === undefined) {
        console.warn('Unexpected DeepSeek response structure:', JSON.stringify(data));
      }
      return { text: text ?? '' };
    }

    throw new HttpsError('invalid-argument', `Unknown provider: ${provider}`);
  }
);
