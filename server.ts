import express from "express";
import path from "path";
import fs from 'fs';
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import axios from 'axios';

dotenv.config();

let firebaseConfig: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (err) {
  console.error("Failed to load firebase-applet-config.json", err);
}

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : undefined;

    // Use environment project ID if config is missing or as fallback
    const projectId = firebaseConfig?.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

    if (serviceAccount || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
        projectId: projectId
      });
      console.log("[Firebase Server] Initialized with Service Account / Default Credentials");
    } else {
      // In AI Studio, initializeApp() usually works best without parameters if using the provisioned project
      admin.initializeApp({
        projectId: projectId
      });
      console.log("[Firebase Server] Initialized with Project ID:", projectId);
    }
  }
} catch (err) {
  console.error("[Firebase Server] Initialization Critical Error:", err);
}

// Lazy DB initialization
let _db: any = null;
const getDb = (): any => {
  if (!_db) {
    try {
      _db = firebaseConfig?.firestoreDatabaseId 
        ? getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId)
        : getFirestore(admin.app());
      console.log("[Firestore Server] DB instance created with config ID");
    } catch (err) {
      console.error("[Firestore Server] Failed to create DB instance:", err);
      // Fallback
      try {
        _db = getFirestore();
      } catch (innerErr) {
         console.error("[Firestore Server] Critical Fallback failed:", innerErr);
         throw innerErr;
      }
    }
  }
  return _db!;
};

function sanitizeApiKey(key: string | undefined): string | undefined {
  if (!key) return key;
  let sanitized = key.trim();
  if (sanitized.startsWith('=')) {
    sanitized = sanitized.substring(1);
  }
  return sanitized;
}

function addWavHeader(pcmBuffer: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // file length minus 8 bytes
  header.writeUInt32LE(chunkSize, 4);
  // RIFF type
  header.write("WAVE", 8);
  // format chunk identifier
  header.write("fmt ", 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (raw)
  header.writeUInt16LE(1, 20); // 1 for PCM
  // channel count
  header.writeUInt16LE(numChannels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate
  header.writeUInt32LE(byteRate, 28);
  // block align
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // chunks length
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // API Route for Dynamic Speed Test Payload
  app.get("/api/speedtest", (req, res) => {
    const size = parseInt(req.query.size as string, 10) || 250000; // Default 250KB
    const safeSize = Math.max(1000, Math.min(size, 2000000)); // Min 1KB, Max 2MB
    const buffer = Buffer.alloc(safeSize);
    buffer.fill('x');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.send(buffer);
  });

  const PORT = 3000;

  // Initialize Gemini once or per request? Shared is better for aistudio-build header
  const geminiClient = (apiKey: string) => new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for AI Generation
  app.post("/api/ai/generate", async (req, res) => {
    const { prompt, provider, apiKey, image } = req.body;
    let keyToUse = sanitizeApiKey(apiKey || (provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY));
    
    if (!prompt || !keyToUse) {
      return res.status(400).json({ error: "Missing prompt or API Key" });
    }

    // Heuristic: If they provided a Google key (starts with AIza) for OpenAI provider
    if (provider === "openai" && keyToUse.startsWith("AIza")) {
      return res.status(400).json({ 
        error: "يبدو أنك استخدمت مفتاح Google Gemini في حقل OpenAI. يرجى التأكد من المفتاح المستخدم." 
      });
    }

    try {
      if (provider === "openai") {
        const openai = new OpenAI({ apiKey: keyToUse });
        let messages: any[] = [];
        if (image) {
          messages = [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image } }
              ]
            }
          ];
        } else {
          messages = [{ role: "user", content: prompt }];
        }

        const response = await openai.chat.completions.create({
          model: image ? "gpt-4o" : "gpt-4-turbo",
          messages: messages,
        });
        res.json({ result: response.choices[0].message.content });
      } else {
        const ai = geminiClient(keyToUse);
        
        let inlineDataPart: any = null;
        if (image) {
          if (image.startsWith("data:")) {
            try {
              const commaIndex = image.indexOf(",");
              if (commaIndex !== -1) {
                const mimeMatch = image.substring(0, commaIndex).match(/data:([^;]+);base64/);
                const base64Data = image.substring(commaIndex + 1).replace(/\s/g, "");
                const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
                
                inlineDataPart = {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                };
                console.log(`[AI Vision] Successfully parsed base64 image data of type: ${mimeType}, size: ${base64Data.length} chars`);
              }
            } catch (err) {
              console.error("[AI Vision] Failed to parse base64 image data:", err);
            }
          } else if (image.startsWith("http://") || image.startsWith("https://")) {
            try {
              console.log(`[AI Vision] Downloading remote image for Gemini: ${image}`);
              const imgRes = await axios.get(image, { responseType: 'arraybuffer', timeout: 8000 });
              const contentType = imgRes.headers['content-type'] || 'image/jpeg';
              const base64Data = Buffer.from(imgRes.data).toString('base64');
              
              inlineDataPart = {
                inlineData: {
                  data: base64Data,
                  mimeType: contentType
                }
              };
              console.log(`[AI Vision] Successfully downloaded and converted remote image of type: ${contentType}, size: ${base64Data.length} chars`);
            } catch (err: any) {
              console.error("[AI Vision] Failed to download remote image for Gemini:", err.message);
            }
          }
        }
        
        // Robust model rotation strategy to handle Quota Exceeded (429) & High Demand (503) errors
        const modelsToTry = [
            "gemini-flash-latest",
            "gemini-2.5-flash-lite",
            "gemini-pro-latest"
        ];

        let lastError: any = null;
        
        for (const modelName of modelsToTry) {
          try {
            console.log(`[AI] Trying model: ${modelName}${inlineDataPart ? " (with image)" : ""}`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: inlineDataPart ? [
                { text: prompt },
                inlineDataPart
              ] : prompt,
              config: inlineDataPart ? undefined : {
                tools: [{ googleSearch: {} }]
              }
            });
            
            const text = response.text;
            
            if (!text) {
               throw new Error("Empty response from model");
            }

            return res.json({ result: text });
          } catch (error: any) {
            lastError = error;
            
            const isQuotaError = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED");
            const isHighDemand = error.message?.includes("503") || error.message?.includes("demand") || error.message?.includes("UNAVAILABLE");
            const isNotFound = error.message?.includes("404") || error.message?.includes("not found");

            console.warn(`[AI FALLBACK] Model ${modelName} failed. Reason: ${isQuotaError ? "Quota" : isHighDemand ? "Demand" : isNotFound ? "NotFound" : "Error"}. Details: ${error.message}`);

            if (error.message?.includes("401") || error.message?.includes("API_KEY_INVALID")) {
              break;
            }
            // For quota errors, we try the next model instead of breaking
            if (isQuotaError) {
              console.log(`[AI] Skipping ${modelName} due to quota, trying next model...`);
              continue;
            }

            // Larger delay for Demand before trying next model
            if (isHighDemand) {
               await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        // Specific error handling for the frontend
        if (lastError?.message?.includes("401") || lastError?.message?.includes("API_KEY_INVALID")) {
           return res.status(401).json({ error: "انتهت صلاحية مفتاح الـ API أو أنه غير صالح. يرجى التحقق من الإعدادات." });
        }
        if (lastError?.message?.includes("429") || lastError?.message?.includes("quota")) {
           return res.status(429).json({ error: "تم الوصول إلى الحد الأقصى للاستخدام (Quota Exceeded) لمفتاحك الحالي." });
        }

        throw lastError || new Error("All Gemini models failed to respond.");
      }
    } catch (error: any) {
      console.error("[AI ERROR]", error);
      res.status(500).json({ 
        error: error.message || "Something went wrong during generation",
        details: error 
      });
    }
  });

  // API Route for Image Generation
  app.post("/api/ai/image", async (req, res) => {
    const { prompt, aspectRatio, provider, apiKey } = req.body;
    let selectedProvider = provider || "gemini";
    let keyToUse = sanitizeApiKey(apiKey);

    if (!keyToUse) {
      if (selectedProvider === "openai") {
        keyToUse = sanitizeApiKey(process.env.OPENAI_API_KEY);
      } else {
        keyToUse = sanitizeApiKey(process.env.GEMINI_API_KEY);
      }
    }

    if (!prompt || !keyToUse) {
      return res.status(400).json({ error: "Missing prompt or API Key" });
    }

    try {
      if (selectedProvider === "openai" && !keyToUse.startsWith("AIza")) {
        const openai = new OpenAI({ apiKey: keyToUse });
        let size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
        if (aspectRatio === "16:9") size = "1792x1024";
        if (aspectRatio === "9:16") size = "1024x1792";
        
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: size,
        });
        res.json({ result: response.data[0].url });
      } else {
        const ai = geminiClient(keyToUse);
        let ratioStr = "1:1";
        if (aspectRatio === "16:9") ratioStr = "16:9";
        if (aspectRatio === "9:16") ratioStr = "9:16";

        let base64 = "";
        let succeeded = false;
        let lastError: any = null;

        // Try standard generateImages model first with proper SDK parameters (camelCase inside config)
        try {
          console.log("[IMAGE SYSTEM] Attempting generateImages with model: imagen-4.0-generate-001");
          const response = (await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              aspectRatio: ratioStr,
              outputMimeType: 'image/jpeg',
              personGeneration: "ALLOW_ALL" as any
            }
          })) as any;

          if (response.generatedImages && response.generatedImages.length > 0) {
            base64 = response.generatedImages[0].image.imageBytes;
            succeeded = true;
          } else if (response.images && response.images.length > 0) {
            base64 = response.images[0].imageBytes;
            succeeded = true;
          }
        } catch (err: any) {
          console.warn("[IMAGE SYSTEM] generateImages with imagen-4.0-generate-001 failed:", err.message || err);
          lastError = err;
        }

        // Try falling back to imagen-3.0-generate-002 if 4.0 fails/not found
        if (!succeeded) {
          try {
            console.log("[IMAGE SYSTEM] Falling back to generateImages with model: imagen-3.0-generate-002");
            const response = (await ai.models.generateImages({
              model: 'imagen-3.0-generate-002',
              prompt: prompt,
              config: {
                numberOfImages: 1,
                aspectRatio: ratioStr,
                outputMimeType: 'image/jpeg',
                personGeneration: "ALLOW_ALL" as any
              }
            })) as any;

            if (response.generatedImages && response.generatedImages.length > 0) {
              base64 = response.generatedImages[0].image.imageBytes;
              succeeded = true;
            } else if (response.images && response.images.length > 0) {
              base64 = response.images[0].imageBytes;
              succeeded = true;
            }
          } catch (err: any) {
             console.warn("[IMAGE SYSTEM] generateImages with imagen-3.0-generate-002 failed:", err.message || err);
             lastError = err;
          }
        }

        // Try falling back to imagen-3.0-generate-001 if generate-002 fails/not found
        if (!succeeded) {
          try {
            console.log("[IMAGE SYSTEM] Falling back to generateImages with model: imagen-3.0-generate-001");
            const response = (await ai.models.generateImages({
              model: 'imagen-3.0-generate-001',
              prompt: prompt,
              config: {
                numberOfImages: 1,
                aspectRatio: ratioStr,
                outputMimeType: 'image/jpeg',
                personGeneration: "ALLOW_ALL" as any
              }
            })) as any;

            if (response.generatedImages && response.generatedImages.length > 0) {
              base64 = response.generatedImages[0].image.imageBytes;
              succeeded = true;
            } else if (response.images && response.images.length > 0) {
              base64 = response.images[0].imageBytes;
              succeeded = true;
            }
          } catch (err: any) {
             console.warn("[IMAGE SYSTEM] generateImages with imagen-3.0-generate-001 failed:", err.message || err);
             lastError = err;
          }
        }

        // Try falling back to multimodal image generation models (gemini-2.5-flash-image) using generateContent
        if (!succeeded) {
          const contentModels = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview'];
          for (const modelName of contentModels) {
            try {
              console.log(`[IMAGE SYSTEM] Falling back to generateContent with model: ${modelName}`);
              const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                  imageConfig: {
                    aspectRatio: ratioStr as any,
                    imageSize: "1K"
                  }
                } as any
              });

              if (response.candidates && response.candidates[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                  if (part.inlineData && part.inlineData.data) {
                    base64 = part.inlineData.data;
                    succeeded = true;
                    console.log(`[IMAGE SYSTEM] Successfully generated image using multimodal generateContent with ${modelName}`);
                    break;
                  }
                }
              }
              if (succeeded) break;
            } catch (err: any) {
               console.warn(`[IMAGE SYSTEM] generateContent on ${modelName} failed:`, err.message || err);
               lastError = err;
            }
          }
        }

        if (!succeeded) {
          throw lastError || new Error("All image generation models and fallback strategies failed.");
        }

        res.json({ result: `data:image/jpeg;base64,${base64}` });
      }
    } catch (error: any) {
      console.error("[IMAGE GENERATION ERROR]", error);
      res.status(500).json({ error: error.message || "Something went wrong during image generation" });
    }
  });

  // API Route for Vision
  app.post("/api/ai/vision", async (req, res) => {
    const { prompt, image, provider, apiKey } = req.body;
    let selectedProvider = provider || "openai";
    let keyToUse = sanitizeApiKey(apiKey);

    // Smart override: if no explicit API key is passed and we choose openai but only have gemini,
    // fallback gracefully to gemini to keep the system robust and functional.
    if (!keyToUse) {
      if (selectedProvider === "openai") {
        if (process.env.OPENAI_API_KEY) {
          keyToUse = sanitizeApiKey(process.env.OPENAI_API_KEY);
        } else if (process.env.GEMINI_API_KEY) {
          selectedProvider = "gemini";
          keyToUse = sanitizeApiKey(process.env.GEMINI_API_KEY);
          console.log("[VISION SYSTEM] No OpenAI Key found on server. Gracefully falling back to Gemini Vision.");
        }
      } else {
        keyToUse = sanitizeApiKey(process.env.GEMINI_API_KEY);
      }
    }

    if (!image || !keyToUse) {
      return res.status(400).json({ error: "Missing image data or API Key" });
    }

    try {
      if (selectedProvider === "openai") {
        const openai = new OpenAI({ apiKey: keyToUse });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt || "وصف هذه الصورة بالتفصيل:" },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
          max_tokens: 1000,
        });
        res.json({ result: response.choices[0].message.content });
      } else {
        const ai = geminiClient(keyToUse);
        const visionModels = [
          "gemini-flash-latest",
          "gemini-2.5-flash-lite",
          "gemini-pro-latest"
        ];
        let lastVisionErr = null;

        const base64Data = image.split(",")[1] || image;
        const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";

        for (const vModel of visionModels) {
          try {
            console.log(`[Vision] Trying model: ${vModel}`);
            const response = await ai.models.generateContent({
              model: vModel,
              contents: [{
                role: 'user',
                parts: [
                  { text: prompt || "قم بتحليل هذه الصورة بدقة عالية ووصف محتوياتها." },
                  { inlineData: { data: base64Data, mimeType } }
                ]
              }]
            });
            return res.json({ result: response.text });
          } catch (err: any) {

            lastVisionErr = err;
            const isQuotaError = err.message?.includes("429") || err.message?.includes("quota");
            const isHighDemand = err.message?.includes("503") || err.message?.includes("demand");
            const isNotFound = err.message?.includes("404") || err.message?.includes("not found");
            
            console.warn(`[VISION FALLBACK] Model ${vModel} failed. Reason: ${isQuotaError ? "Quota" : isHighDemand ? "Demand" : isNotFound ? "NotFound" : "Error"}.`);

            if (err.message?.includes("401") || err.message?.includes("API_KEY_INVALID")) {
              break;
            }
            if (isQuotaError) {
              break;
            }

            if (isHighDemand) {
               await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }
        throw lastVisionErr;
      }
    } catch (error: any) {
      console.error("[VISION ERROR]", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Video Scenes Generation
  app.post("/api/ai/video/generate-scenes", async (req, res) => {
    const { prompt, videoData, apiKey, provider } = req.body;
    let selectedProvider = provider || "gemini";
    let keyToUse = sanitizeApiKey(apiKey);

    if (!keyToUse) {
      if (selectedProvider === "openai") {
        keyToUse = sanitizeApiKey(process.env.OPENAI_API_KEY);
      } else {
        keyToUse = sanitizeApiKey(process.env.GEMINI_API_KEY);
      }
    }

    if (!prompt && !videoData) return res.status(400).json({ error: "Missing prompt or video reference" });
    
    try {
      let text = "[]";

      if (selectedProvider === "openai" && !keyToUse?.startsWith("AIza")) {
        const openai = new OpenAI({ apiKey: keyToUse });
        const messages: any[] = [];
        
        let content: any[] = [];
        if (prompt) {
          content.push({ type: "text", text: `Based on this concept or video, generate 3-5 distinct scene descriptions for a video. Format as JSON array of objects with "prompt" (scene description) and "duration" (in seconds, e.g. "5s"). Concept: ${prompt}` });
        } else {
          content.push({ type: "text", text: `Analyze the provided video frame/context and generate 3-5 continuation scene descriptions. Format as JSON array of objects with "prompt" (scene description) and "duration" (in seconds, e.g. "5s").` });
        }

        if (videoData) {
           content.push({ type: "image_url", image_url: { url: videoData } });
        }
        
        messages.push({ role: "user", content });

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          max_tokens: 1000,
        });
        
        text = response.choices[0].message.content || "[]";
      } else {
        const ai = geminiClient(keyToUse!);
        
        const contents: any[] = [{ role: 'user', parts: [] }];
        
        if (prompt) {
            contents[0].parts.push({ text: `Based on this concept or video, generate 3-5 distinct scene descriptions for a video. Format as JSON array of objects with "prompt" (scene description) and "duration" (in seconds, e.g. "5s"). Concept: ${prompt}` });
        } else {
            contents[0].parts.push({ text: `Analyze the provided video frame/context and generate 3-5 continuation scene descriptions. Format as JSON array of objects with "prompt" (scene description) and "duration" (in seconds, e.g. "5s").` });
        }

        if (videoData) {
          // Assume video frame/thumbnail provided as base64 for contextual analysis
          const base64Data = videoData.split(",")[1] || videoData;
          const mimeType = videoData.split(";")[0].split(":")[1] || "image/jpeg";
          contents[0].parts.push({
            inlineData: { data: base64Data, mimeType }
          });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents
        });
        
        text = response.text || "[]";
      }
      
      // Ensure JSON extraction
      let jsonStr = text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      
      let scenes = [];
      try {
        scenes = JSON.parse(jsonStr);
      } catch (e) {
        // fallback mock
        scenes = [
          { prompt: "مشهد البداية: " + prompt, duration: "3s" },
          { prompt: "مشهد تفصيلي متصل", duration: "5s" },
          { prompt: "مشهد الختام والنهاية", duration: "4s" },
        ];
      }
      
      res.json({ scenes });
    } catch (e: any) {
      console.error("[VIDEO SCENES ERROR]", e);
      res.status(500).json({ error: e.message });
    }
  });

  // API Route for Video Render Processing (Real DB Integrated)
  app.post("/api/ai/video/render", async (req, res) => {
    const { scenes } = req.body;
    const jobId = `vid-${Date.now()}`;
    
    try {
      const db = getDb();
      await db.collection("video_jobs").doc(jobId).set({
        jobId,
        scenes: scenes || [],
        status: "processing",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Simulate background rendering
      setTimeout(async () => {
        try {
          await db.collection("video_jobs").doc(jobId).update({
            status: "completed",
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-32128-large.mp4",
            updatedAt: Timestamp.now()
          });
          console.log(`[Video Render] Job ${jobId} completed successfully.`);
        } catch (updateErr) {
          console.error(`[Video Render] Failed to update job status for ${jobId}:`, updateErr);
        }
      }, 5000);

      res.json({
        status: "processing",
        jobId,
        message: "جاري دمج ومعالجة المشاهد في الخلفية..."
      });
    } catch (err: any) {
      console.warn("[VIDEO RENDER DATABASE FALLBACK]", err.message || err);
      // Fallback if db is degraded or service credentials are missing
      res.json({
        status: "processing",
        jobId,
        message: "جاري دمج ومعالجة المشاهد في الخلفية..."
      });
    }
  });

  // API Route for Quick Actions
  app.post("/api/ai/quick-action", async (req, res) => {
    const { content, action, provider, apiKey } = req.body;
    const keyToUse = sanitizeApiKey(apiKey || process.env.GEMINI_API_KEY);
    
    if (!content || !action || !keyToUse) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let promptSuffix = "";
    switch(action) {
      case 'improve': promptSuffix = `قم بتحسين النص التالي احترافياً ليكون أكثر جاذبية (ارجع النص فقط):\n\n${content}`; break;
      case 'shorten': promptSuffix = `قم باختصار النص التالي بشكل مفيد ومباشر (ارجع النص فقط):\n\n${content}`; break;
      case 'expand': promptSuffix = `قم بتوسيع النص التالي وإضافة تفاصيل غنية (ارجع النص فقط):\n\n${content}`; break;
      case 'translate': promptSuffix = `قم بترجمة النص التالي بأسلوب احترافي سلس (لغة الهدف: الإنجليزية أو العربية حسب الأصل) (ارجع النص فقط):\n\n${content}`; break;
      default: promptSuffix = content;
    }

    try {
      const ai = geminiClient(keyToUse);
      // Try flash-series for speed
      const engineModels = [
        "gemini-flash-latest", 
        "gemini-2.5-flash-lite", 
        "gemini-pro-latest"
      ];
      let lastActionErr = null;
      
      for (const m of engineModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: promptSuffix,
            config: {
              tools: [{ googleSearch: {} }]
            }
          });
          return res.json({ result: response.text });
        } catch (err: any) {
          lastActionErr = err;
          const isQuotaError = err.message?.includes("429") || err.message?.includes("quota");
          const isHighDemand = err.message?.includes("503") || err.message?.includes("demand");
          
          console.warn(`[QUICK-ACTION FALLBACK] Model ${m} failed. Reason: ${isQuotaError ? "Quota" : isHighDemand ? "Demand" : "Error"}.`);

          if (err.message?.includes("401") || err.message?.includes("API_KEY_INVALID")) {
            break;
          }
          if (isQuotaError) {
            break;
          }

          if (isHighDemand) {
             await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      throw lastActionErr;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for TTS (Text-to-Speech) using AI
  app.post("/api/ai/tts", async (req, res) => {
    const { text, voice, apiKey, provider } = req.body;
    let selectedProvider = provider || "gemini";
    let keyToUse = sanitizeApiKey(apiKey);

    if (!keyToUse) {
      if (selectedProvider === "openai") {
        keyToUse = sanitizeApiKey(process.env.OPENAI_API_KEY);
      } else {
        keyToUse = sanitizeApiKey(process.env.GEMINI_API_KEY);
      }
    }

    if (!text || !keyToUse) {
      return res.status(400).json({ error: "Missing text or API Key" });
    }

    try {
      if (selectedProvider === "openai" && !keyToUse.startsWith("AIza")) {
        const openai = new OpenAI({ apiKey: keyToUse });
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: voice || "alloy",
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length
        });
        res.send(buffer);
      } else {
        // Use Gemini TTS
        const ai = geminiClient(keyToUse);
        
        let geminiVoice = "Kore";
        // Map OpenAI requested voices to Gemini equivalents if possible
        if (voice === "alloy") geminiVoice = "Zephyr";   // Female (Bright, clear, energetic)
        if (voice === "shimmer") geminiVoice = "Aoede";  // Female (Breezy, natural, conversational)
        if (voice === "nova") geminiVoice = "Kore";      // Female (Firm, confident, youthful)
        if (voice === "onyx") geminiVoice = "Charon";    // Male (Informative, calm, professional, assured)
        if (voice === "echo") geminiVoice = "Fenrir";    // Male (Excitable, passionate, energetic, friendly)
        if (voice === "fable") geminiVoice = "Puck";     // Male (Upbeat, lively, energetic, playful)
        
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: geminiVoice },
                },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
           throw new Error("No audio returned from Gemini");
        }
        
        const rawPcmBuffer = Buffer.from(base64Audio, 'base64');
        const buffer = addWavHeader(rawPcmBuffer, 24000);
        res.set({
          'Content-Type': 'audio/wav',
          'Content-Length': buffer.length
        });
        res.send(buffer);
      }
    } catch (error: any) {
       console.error("[TTS ERROR]", error);
       res.status(500).json({ error: error.message || "Failed to generate text-to-speech audio" });
    }
  });

  // Helper to obtain standard public origin for Cloud Run proxy
  const getPublicOrigin = (req: express.Request): string => {
    const forwardedHost = req.headers['x-forwarded-host'];
    const host = typeof forwardedHost === 'string' ? forwardedHost : req.headers.host;
    return `https://${host}`;
  };

  // 1. OAuth URL Generation
  app.get("/api/auth/:platform/url", async (req, res) => {
    const { platform } = req.params;
    const { brandId, userId } = req.query;
    const origin = getPublicOrigin(req);

    if (!brandId || !userId) {
      return res.status(400).json({ error: "Missing brandId or userId" });
    }

    try {
      const stateId = generateId();
      await getDb().collection('oauth_states').doc(stateId).set({
        brandId,
        userId,
        platform,
        provider: platform,
        status: 'pending',
        createdAt: Timestamp.now()
      });

      if (platform === 'youtube' || platform === 'google') {
        const redirectUri = `${origin}/api/auth/google/callback`;
        const oauth2Client = new google.auth.OAuth2(
          process.env.YOUTUBE_CLIENT_ID,
          process.env.YOUTUBE_CLIENT_SECRET,
          redirectUri
        );

        const url = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
          ],
          state: stateId,
          prompt: 'consent'
        });

        res.json({ url });
      } else {
        res.status(400).json({ error: `Platform ${platform} not supported yet for direct OAuth via this route.` });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Google OAuth Callback Handler
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    const origin = getPublicOrigin(req);

    if (!code || !state) {
      return res.redirect('/integrations?error=missing_params');
    }

    try {
      // 1. Verify state in Firestore
      const stateDoc = await getDb().collection('oauth_states').doc(state as string).get();
      if (!stateDoc.exists || stateDoc.data()?.status !== 'pending') {
        return res.redirect('/integrations?error=invalid_state');
      }

      const { brandId, provider, userId } = stateDoc.data()!;

      // 2. Exchange code for tokens
      const redirectUri = `${origin}/api/auth/google/callback`;
      const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // 3. Get profile info
      let metadata: any = {};
      if (provider === 'youtube' || provider === 'google') {
         try {
           const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
           const channelResponse = await youtube.channels.list({
             part: ['snippet', 'statistics'],
             mine: true
           });
           
           const channel = channelResponse.data.items?.[0];
           if (channel) {
             metadata = {
               channelId: channel?.id,
               title: channel?.snippet?.title,
               thumbnails: channel?.snippet?.thumbnails,
               subscriberCount: channel?.statistics?.subscriberCount,
               viewCount: channel?.statistics?.viewCount,
               videoCount: channel?.statistics?.videoCount
             };
           } else {
             // If there's no channel found for this account (items list is empty)
             metadata = {
               channelId: `yt_fallback_${Date.now()}`,
               title: "قناة يوتيوب الافتراضية",
               fallback: true,
               errorMsg: "لم يُعثر على قناة نشطة لهذا الحساب بعد."
             };
           }
         } catch (ytErr: any) {
           console.error("[YOUTUBE API ERROR] Failed to fetch channel details, resolving with fallback:", ytErr.message || ytErr);
           
           // Fallback to basic profile info if youtube channels.list gives 403/other error
           try {
             const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
             const userInfo = await oauth2.userinfo.get();
             metadata = {
               channelId: `yt_fallback_${userInfo.data.id || Date.now()}`,
               title: userInfo.data.name ? `${userInfo.data.name} (يوتيوب)` : "قناة يوتيوب الافتراضية",
               thumbnails: userInfo.data.picture ? { default: { url: userInfo.data.picture } } : null,
               fallback: true,
               errorMsg: ytErr.message || "403_ACCESS_EXPIRED_OR_NO_CHANNEL"
             };
           } catch (gErr) {
             metadata = {
               channelId: `yt_fallback_${Date.now()}`,
               title: "قناة يوتيوب",
               fallback: true,
               errorMsg: ytErr.message
             };
           }
         }
      }

      // 4. Save/Update integration account
      const integrationRef = getDb().collection('integrations');
      const accountData = {
        brandId,
        userId: userId || null, 
        provider,
        type: 'social',
        status: 'connected',
        credentials: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? Timestamp.fromMillis(tokens.expiry_date) : null
        },
        metadata,
        lastSyncedAt: Timestamp.now()
      };

      const existingQuery = await integrationRef
        .where('brandId', '==', brandId)
        .where('provider', '==', provider)
        .get();

      if (!existingQuery.empty) {
        await integrationRef.doc(existingQuery.docs[0].id).update(accountData);
      } else {
        await integrationRef.add(accountData as any);
      }

      // 5. Cleanup state
      await stateDoc.ref.update({ status: 'completed' });

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body style="background: #020617; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
            <div>
              <h2 style="color: #10b981;">تم الربط بنجاح!</h2>
              <p>يتم الآن إغلاق هذه النافذة وتحديث البيانات...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${provider}' }, '*');
                  setTimeout(() => window.close(), 1500);
                } else {
                  window.location.href = '/integrations?success=connected';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("[OAUTH CALLBACK ERROR]", error);
      res.send(`
        <html>
          <body style="background: #020617; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
            <div>
              <h2 style="color: #ef4444;">حدث خطأ أثناء الربط</h2>
              <p>${error.message}</p>
              <button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 20px;">إغلاق النافذة</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // API Route to fetch real videos from YouTube
  app.get("/api/channels/youtube/videos", async (req, res) => {
    const { userId, integrationId } = req.query;

    if (!userId || !integrationId) {
      return res.status(400).json({ error: "Missing userId or integrationId" });
    }

    try {
      // 1. Get tokens from Firestore
      const integrationDoc = await getDb().collection('integrations').doc(integrationId as string).get();
      if (!integrationDoc.exists) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const data = integrationDoc.data();
      if (!data?.credentials?.accessToken) {
        return res.status(401).json({ error: "No access token found" });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: data.credentials.accessToken,
        refresh_token: data.credentials.refreshToken,
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      // 2. Fetch videos
      const listRes = await youtube.search.list({
        part: ['snippet'],
        forMine: true,
        type: ['video'],
        maxResults: 50,
        order: 'date'
      });

      const videoIds = listRes.data.items?.map(item => item.id?.videoId).filter(Boolean) as string[];
      
      if (!videoIds || videoIds.length === 0) {
        return res.json({ videos: [] });
      }

      // 3. Get detailed stats for these videos
      const statsRes = await youtube.videos.list({
        part: ['snippet', 'statistics'],
        id: videoIds
      });

      const videos = statsRes.data.items?.map(v => ({
        id: v.id,
        originalId: v.id,
        title: v.snippet?.title,
        description: v.snippet?.description,
        thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url,
        status: 'published',
        views: parseInt(v.statistics?.viewCount || '0'),
        likes: parseInt(v.statistics?.likeCount || '0'),
        comments: parseInt(v.statistics?.commentCount || '0'),
        date: v.snippet?.publishedAt
      }));

      res.json({ videos });
    } catch (error: any) {
      console.error("[YOUTUBE VIDEOS FETCH ERROR]", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/sync", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      
      const db = getDb();
      const docs = await db.collection('integrations').where('userId', '==', userId).get();

      for (let doc of docs.docs) {
        const data = doc.data();
        if ((data.provider === 'youtube' || data.provider === 'google') && data.credentials?.accessToken) {
          try {
            const oauth2Client = new google.auth.OAuth2(
              process.env.YOUTUBE_CLIENT_ID,
              process.env.YOUTUBE_CLIENT_SECRET
            );
            oauth2Client.setCredentials({
              access_token: data.credentials.accessToken,
              refresh_token: data.credentials.refreshToken,
            });

            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            const channelResponse = await youtube.channels.list({ part: ['statistics'], mine: true });

            if (channelResponse && channelResponse.data.items?.[0]) {
               const stats = channelResponse.data.items[0].statistics;
               await doc.ref.update({
                 'metadata.subscriberCount': stats?.subscriberCount,
                 'metadata.viewCount': stats?.viewCount,
                 'metadata.videoCount': stats?.videoCount,
                 'lastSyncedAt': Timestamp.now()
               });
            }
          } catch(e) {
             console.error("Failed to sync integration:", doc.id, e);
          }
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("[SYNC ERROR]", e);
      res.status(500).json({ error: e.message });
    }
  });

  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // API Route for Scrapping / Website Analysis
  app.post("/api/scrape", async (req, res) => {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // Sanitize and validate URL
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      new URL(url); // Should throw if invalid
    } catch (err) {
      return res.status(400).json({ error: "الرابط غير صحيح. يرجى التأكد من كتابة رابط صالح (مثال: https://example.com)" });
    }

    try {
      console.log(`[Scrape] Fetching content for: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });

      if (response.status >= 400) {
        throw new Error(`Status ${response.status}`);
      }

      const html = response.data;
      if (typeof html !== 'string') {
        throw new Error("Received non-string response");
      }
      
      // Enhanced extraction
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const metaDescMatch = html.match(/<meta name="description" content="(.*?)"/i) || html.match(/<meta property="og:description" content="(.*?)"/i);
      const canonicalMatch = html.match(/<link rel="canonical" href="(.*?)"/i);
      const robotsMatch = html.match(/<meta name="robots" content="(.*?)"/i);
      const viewportMatch = html.match(/<meta name="viewport" content="(.*?)"/i);
      
      const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/i);
      const ogImage = html.match(/<meta property="og:image" content="(.*?)"/i);
      const twitterCard = html.match(/<meta name="twitter:card" content="(.*?)"/i);

      const h1s = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []).map((h: string) => h.replace(/<[^>]+>/g, '').trim());
      const h2s = (html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []).map((h: string) => h.replace(/<[^>]+>/g, '').trim());
      const h3s = (html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || []).map((h: string) => h.replace(/<[^>]+>/g, '').trim());
      
      const images = (html.match(/<img[^>]*>/gi) || []);
      const imagesWithoutAlt = images.filter(img => !/alt=/i.test(img)).length;
      
      const links = (html.match(/<a\s[^>]*href=["'](.*?)["']/gi) || []);
      const linksCount = links.length;
      const internalLinks = links.filter(l => l.includes('href="/') || l.includes(url)).length;
      
      const scriptTags = (html.match(/<script/gi) || []).length;
      const styleTags = (html.match(/<style/gi) || []).length;

      // Schema Markup detection
      const jsonLd = (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [])
         .map(s => s.replace(/<[^>]+>/g, '').trim());

      // Basic text extraction (removing tags)
      const bodyText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 20000); 

      // Extract emails and phones via Regex as fallback
      const emails = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
      const uniqueEmails = [...new Set(emails)];
      const phones = html.match(/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*/gi) || [];
      const uniquePhones = [...new Set(phones)].slice(0, 5);

      res.json({
        url,
        title: titleMatch ? titleMatch[1] : "No Title",
        description: metaDescMatch ? metaDescMatch[1] : "No Description",
        social: {
          ogTitle: ogTitle ? ogTitle[1] : null,
          ogImage: ogImage ? ogImage[1] : null,
          twitterCard: twitterCard ? twitterCard[1] : null
        },
        meta: {
          robots: robotsMatch ? robotsMatch[1] : null,
          viewport: viewportMatch ? viewportMatch[1] : null
        },
        technical: {
          h1s,
          h2s: h2s.slice(0, 20),
          h3s: h3s.slice(0, 20),
          imagesCount: images.length,
          imagesWithoutAlt,
          linksCount,
          internalLinks,
          canonical: canonicalMatch ? canonicalMatch[1] : null,
          scriptCount: scriptTags,
          styleCount: styleTags,
          pageSize: html.length,
          hasSchema: jsonLd.length > 0,
          emails: uniqueEmails,
          phones: uniquePhones
        },
        content: bodyText,
        isFallback: false
      });
    } catch (error: any) {
      console.warn("[Scrape Warning] Direct fetch failed. Generating descriptive smart fallback client-side context.", error.message);
      
      let host = "example.com";
      try {
        if (url) {
          host = new URL(url).hostname;
        }
      } catch (e) {}

      const cleanName = host.replace('www.', '').split('.')[0];
      const prettyName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      res.json({
        url,
        title: `${prettyName} | المتجر الإلكتروني`,
        description: `موقع إلكتروني لأعمال ${prettyName}. جاري تحليله وتحسينه عبر Fluxcore AI.`,
        isFallback: true,
        fallbackReason: error.message || "الموقع محمي أو غير متاح حالياً للزحف المباشر",
        social: {
          ogTitle: `${prettyName} | Store`,
          ogImage: null,
          twitterCard: "summary_large_image"
        },
        meta: {
          robots: "index, follow",
          viewport: "width=device-width, initial-scale=1.0"
        },
        technical: {
          h1s: [prettyName],
          h2s: ["من نحن", "خدماتنا", "تواصل معنا"],
          h3s: ["تفاصيل أكثر"],
          imagesCount: 6,
          imagesWithoutAlt: 1,
          linksCount: 12,
          internalLinks: 10,
          canonical: url,
          scriptCount: 3,
          styleCount: 1,
          pageSize: 11200,
          hasSchema: false
        },
        content: `هذا تحليل تقديري ذكي لمتجر ${prettyName} ($url) نظراً لتعذر الزحف المباشر على الرابط بسبب جدار حماية خارجي أو قيود DNS (أيضاً خطأ: ${error.message}). سنقوم بتحليل بنيوي وتقديم توصيات مُحسنة للنمو الرقمي والـ SEO.`
      });
    }
  });


  // ──────────────────────────────────────────────────────────────
  //  WhatsApp Bot Routes
  // ──────────────────────────────────────────────────────────────

  /**
   * POST /api/whatsapp/simulate
   * Process a simulated incoming WhatsApp message and return bot reply.
   * Used by the frontend WhatsApp Simulator.
   */
  app.post("/api/whatsapp/simulate", async (req, res) => {
    const { message, userId, dialect, userStats } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    const dialectMap: Record<string, string> = {
      colloquial: "عربي عامي متوسط مفهوم للجميع، لهجة محايدة ودية",
      gulf:       "خليجي سعودي (شلونك، الحين، وايد، تكفى)",
      yemeni:     "يمني دارج (ذحين، أشتي، قوي، إيش)",
      egyptian:   "مصري عامي (إزيك، دلوقتي، عاوز، قوي)",
      levantine:  "شامي (كيفك، هلق، شو، كتير)",
    };
    const dialectNote = dialectMap[dialect] || dialectMap.colloquial;

    // Check if it's a known command
    const commands: Record<string, string> = {
      "!رصيد":    "balance", "!balance": "balance", "رصيد": "balance",
      "!حالة":    "status",  "!status":  "status",  "حالة": "status",
      "!جديد":    "latest",  "!latest":  "latest",  "جديد": "latest",
      "!مساعدة":  "help",    "!help":    "help",    "مساعدة": "help",
    };
    const cmd = commands[message.trim().toLowerCase()];

    if (cmd === "help") {
      return res.json({ reply: `🤖 *أوامر الموظف الذكي - فلاكس كور*\n\n📊 *!رصيد* — رصيدك ونقاطك\n⚙️ *!حالة* — مهامك النشطة\n🎨 *!جديد* — آخر تصميم لك\n📱 *!مساعدة* — هذه القائمة\n\nأو اكتب أي سؤال بحرية وأنا أجاوبك 😊` });
    }
    if (cmd === "balance") {
      const credits = userStats?.credits ?? 480;
      const plan = userStats?.plan ?? "Pro";
      const emoji = credits > 200 ? "🟢" : credits > 50 ? "🟡" : "🔴";
      return res.json({ reply: `💳 *رصيدك في فلاكس كور*\n\n${emoji} النقاط المتبقية: *${credits} نقطة*\n📦 الباقة: *${plan}*\n\n${credits < 50 ? "⚠️ رصيدك منخفض، يُنصح بالشحن" : "✅ رصيدك كافي، واصل الإبداع!"}` });
    }
    if (cmd === "status") {
      const jobs = userStats?.activeJobs ?? 0;
      return res.json({ reply: jobs === 0 ? `⚙️ *حالة الطابور*\n\n✅ ما في مهام نشطة حالياً\n\nكل شيء اكتمل. تقدر تشوف نتائجك في السجل.` : `⚙️ *حالة الطابور*\n\n🔄 عدد المهام قيد المعالجة: *${jobs}*\n\nراح يوصلك إشعار لما تكتمل.` });
    }
    if (cmd === "latest") {
      const asset = userStats?.latestAsset;
      if (!asset) return res.json({ reply: `🎨 *آخر تصميم*\n\nما في أصول مولدة بعد! ابدأ بتوليد صورة أو صوت من مختبر الوسائط 🚀` });
      const typeLabel: Record<string, string> = { voice: "🎙️ تعليق صوتي", image: "🖼️ صورة", video: "🎬 فيديو" };
      return res.json({ reply: `🎨 *آخر تصميم لك*\n\n${typeLabel[asset.type] || "📄 أصل"}\n🕐 ${asset.createdAt}\n\nافتح السجل لتحميله.` });
    }

    // Free-form AI reply
    try {
      const keyToUse = sanitizeApiKey(process.env.GEMINI_API_KEY);
      if (!keyToUse) throw new Error("No AI key");

      const ai = geminiClient(keyToUse);
      const prompt = `أنت موظف ذكي في منصة Fluxcore AI للإعلام الرقمي.
المستخدم أرسل لك رسالة واتساب. اكتب له رداً باللهجة التالية: ${dialectNote}
الرد يكون قصيراً (2-4 أسطر)، مفيداً وودياً. استخدم الإيموجي بذكاء.
معلومات المستخدم: الرصيد ${userStats?.credits ?? "غير معروف"} نقطة، الباقة ${userStats?.plan ?? "غير معروف"}

رسالة المستخدم: "${message}"

اكتب الرد مباشرة بدون مقدمة.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });
      return res.json({ reply: response.text?.trim() || "حدث خطأ في الرد. جرب مرة ثانية." });
    } catch (err: any) {
      return res.json({ reply: `مرحباً! جاري تجهيز ردي عليك... حاول تكتب أمراً مباشراً مثل *!رصيد* أو *!حالة* 😊` });
    }
  });

  /**
   * POST /api/whatsapp/send-notification
   * Called by the smart employee to send a personalized notification.
   * In Phase 2 will call Evolution API real endpoint.
   */
  app.post("/api/whatsapp/send-notification", async (req, res) => {
    const { userId, eventType, eventData, dialect } = req.body;
    if (!userId || !eventType) return res.status(400).json({ error: "Missing required fields" });

    try {
      // Phase 1: Log to Firestore only (simulator mode)
      const db = getDb();
      await db.collection("wa_notifications").add({
        userId,
        eventType,
        eventData,
        dialect: dialect || "colloquial",
        sentAt: Timestamp.now(),
        gateway: "simulator",
        status: "delivered_to_simulator",
      });

      // Phase 2 placeholder: call Evolution API here when configured
      const evoUrl = process.env.EVOLUTION_API_URL;
      const evoKey = process.env.EVOLUTION_API_KEY;
      if (evoUrl && evoKey && eventData?.phoneNumber) {
        // Will implement real sending in Phase 2
        console.log(`[WhatsApp Bot] Would send to ${eventData.phoneNumber} via Evolution API`);
      }

      return res.json({ success: true, gateway: evoUrl ? "evolution" : "simulator" });
    } catch (err: any) {
      console.error("[WhatsApp Bot]", err);
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/whatsapp/broadcast
   * Send marketing broadcast to all opted-in subscribers.
   */
  app.post("/api/whatsapp/broadcast", async (req, res) => {
    const { message, targetGroup, apiKey } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    try {
      const db = getDb();
      // Save broadcast record
      const ref = await db.collection("wa_broadcasts").add({
        message,
        targetGroup: targetGroup || "all",
        sentAt: Timestamp.now(),
        status: "sent",
        sentBy: req.body.userId || "admin",
      });

      return res.json({ success: true, broadcastId: ref.id, status: "queued" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/whatsapp/webhook
   * Receive real WhatsApp messages from Evolution API (Phase 2)
   */
  app.post("/api/whatsapp/webhook", async (req, res) => {
    const event = req.body;
    console.log("[WhatsApp Webhook] Received:", JSON.stringify(event).slice(0, 200));

    if (event?.data?.message?.conversation) {
      // Process incoming message
      const incomingText = event.data.message.conversation;
      const senderPhone = event.data.key?.remoteJid?.replace("@s.whatsapp.net", "");
      console.log(`[WhatsApp Bot] Message from ${senderPhone}: ${incomingText}`);
      // TODO: Route to per-user bot logic in Phase 2
    }

    return res.status(200).json({ status: "ok" });
  });

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      firebaseProjectId: firebaseConfig?.projectId || "missing",
      envProjectId: process.env.GOOGLE_CLOUD_PROJECT || "missing",
      dbInitialized: !!_db,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasOpenaiKey: !!process.env.OPENAI_API_KEY
    });
  });

  // Vite middleware for development

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.log(`[Server] Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
