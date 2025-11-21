
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, AuditResult, SheetRow } from "../types";

const MODEL_NAME = "gemini-2.5-flash";
const IMAGEN_MODEL = "imagen-4.0-generate-001";

// Helper để khởi tạo AI instance động dựa trên key của profile hiện tại
const getAIInstance = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key bị thiếu. Vui lòng cập nhật trong phần Cấu hình Kênh.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error Details:", error);
  
  let message = error.message || "";
  
  if (message.includes("API_KEY") || message.includes("403")) {
    throw new Error("Lỗi xác thực: API Key không hợp lệ. Vui lòng kiểm tra cấu hình của kênh hiện tại.");
  }
  
  if (message.includes("429") || message.includes("quota")) {
    throw new Error("Hết hạn ngạch (Quota): Hệ thống đang bận. Vui lòng đợi vài giây.");
  }

  if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
    throw new Error("Lỗi mạng: Kiểm tra kết nối internet.");
  }

  if (message.includes("candidate") || message.includes("safety")) {
    throw new Error("Nội dung bị chặn: Vi phạm chính sách an toàn.");
  }

  throw new Error(`Lỗi hệ thống: ${message || "Không xác định"}.`);
};

export const generateVideoContent = async (apiKey: string, topic: string, tone: string, type: 'LONG' | 'SHORT' = 'LONG', relatedVideoId?: string): Promise<GeneratedContent> => {
  
  let prompt = "";
  
  const refContext = relatedVideoId 
    ? `\nTHAM KHẢO VIDEO NGUỒN: YouTube Video ID "${relatedVideoId}". 
       Hãy phân tích ngữ cảnh tiềm năng của video này. Nội dung tạo ra phải là một phiên bản "Remix", "Reaction", hoặc "Nâng cấp" dựa trên chủ đề gốc nhưng hay hơn.` 
    : "";

  if (type === 'SHORT') {
    prompt = `
      Bạn là chuyên gia TikTok/YouTube Shorts.
      Nhiệm vụ: Viết kịch bản video ngắn (dưới 60s) cho chủ đề: "${topic}".
      Phong cách: ${tone}.
      ${refContext}
      
      Yêu cầu:
      1. Tiêu đề cực ngắn, gây sốc hoặc tò mò.
      2. Hook (3s đầu): Phải giữ chân người xem ngay lập tức.
      3. Nội dung chính: Ngắn gọn, đi thẳng vào vấn đề, chia thành các phân cảnh nhanh.
      4. Call to Action (CTA): Ngắn gọn.

      Trả về JSON:
      {
        "title": "Tiêu đề Shorts",
        "description": "Mô tả ngắn + Hashtags",
        "tags": ["#shorts", "#viral", ...],
        "hook": "Câu nói 3s đầu",
        "scriptOutline": ["Cảnh 1: ...", "Cảnh 2: ...", ...],
        "seoScore": 90
      }
    `;
  } else {
    prompt = `
      Bạn là chuyên gia tối ưu hóa YouTube (như VidIQ/TubeBuddy).
      Nhiệm vụ: Tạo nội dung video dài (Long-form) cho chủ đề: "${topic}".
      Phong cách: ${tone}.
      ${refContext}
      
      Yêu cầu đặc biệt:
      1. Tiêu đề phải có tính clickbait cao nhưng không lừa đảo, chứa từ khóa SEO.
      2. Mô tả phải chuẩn SEO, 3 dòng đầu cực quan trọng.
      3. Kịch bản chia thành: Intro, Body (các ý chính), Conclusion.
      4. Chấm điểm SEO (seoScore) từ 0-100 dựa trên độ tiềm năng của chủ đề này.

      Trả về JSON:
      {
        "title": "Tiêu đề video",
        "description": "Mô tả video",
        "tags": ["tag1", "tag2", ...],
        "hook": "Câu nói 5s đầu",
        "scriptOutline": ["Intro: ...", "Phần 1: ...", "Phần 2: ...", "Kết: ..."],
        "seoScore": 85
      }
    `;
  }

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hook: { type: Type.STRING },
            scriptOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
            seoScore: { type: Type.NUMBER },
          },
          required: ["title", "description", "tags", "hook", "scriptOutline", "seoScore"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI không trả về dữ liệu.");
    
    return JSON.parse(text) as GeneratedContent;

  } catch (error) {
    handleGeminiError(error);
  }
};

export const generateOptimizedDescription = async (apiKey: string, title: string, tags: string[], tone: string): Promise<string> => {
  const prompt = `
    Viết lại phần MÔ TẢ (Description) cho video YouTube này để tối ưu SEO và tăng tỷ lệ chuyển đổi.
    
    Tiêu đề: "${title}"
    Tags chính: ${tags.join(", ")}
    Phong cách: ${tone}

    Yêu cầu:
    - 2-3 câu đầu tiên phải chứa từ khóa chính và gây tò mò (quan trọng nhất).
    - Bao gồm lời kêu gọi hành động (CTA).
    - Chèn các từ khóa một cách tự nhiên.
    - Sử dụng emoji hợp lý.
  `;

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const data = JSON.parse(text);
    return data.description;
  } catch (error) {
    handleGeminiError(error);
  }
};

export const optimizeSheetRow = async (apiKey: string, row: SheetRow): Promise<SheetRow> => {
  const prompt = `
    Tối ưu hóa metadata cho video YouTube này để đạt CTR cao nhất.
    Chủ đề gốc: "${row.topic}"
    Nhiệm vụ:
    1. Viết lại Title tối ưu SEO và kích thích tò mò.
    2. Viết Description ngắn (2-3 câu).
    3. Chọn 10 từ khóa tốt nhất (cách nhau bởi dấu phẩy).
    4. Dự đoán điểm SEO (0-100).

    Trả về JSON format.
  `;

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedTitle: { type: Type.STRING },
            optimizedDesc: { type: Type.STRING },
            keywords: { type: Type.STRING, description: "Comma separated keywords" },
            seoScore: { type: Type.NUMBER }
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const data = JSON.parse(text);

    return {
      ...row,
      status: 'OPTIMIZED',
      optimizedTitle: data.optimizedTitle,
      optimizedDesc: data.optimizedDesc,
      keywords: data.keywords,
      seoScore: data.seoScore || 0
    };
  } catch (error) {
    console.error(`Failed to optimize row ${row.id}:`, error);
    throw error; 
  }
};

export const auditChannel = async (apiKey: string, channelInfo: string): Promise<AuditResult> => {
  const prompt = `
    Bạn là chuyên gia Audit kênh YouTube cao cấp.
    Thông tin kênh: "${channelInfo}"
    
    Hãy phân tích dữ liệu, so sánh với thuật toán YouTube hiện tại.
    Trả về JSON gồm: điểm số, phân tích, điểm mạnh/yếu, và đặc biệt là phân tích đối thủ cạnh tranh tiềm năng.
  `;

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            competitorAnalysis: { type: Type.STRING, description: "Phân tích ngắn về đối thủ trong ngách này" }
          },
          required: ["score", "analysis", "actionItems", "strengths", "weaknesses"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI không trả về dữ liệu.");
    return JSON.parse(text) as AuditResult;
  } catch (error) {
    handleGeminiError(error);
  }
};

// --- IMAGE GENERATION FEATURES ---

export const generateThumbnailIdeas = async (apiKey: string, title: string, scriptExcerpt: string, style: string = 'Cinematic'): Promise<string[]> => {
  const prompt = `
    Bạn là đạo diễn hình ảnh YouTube (Thumbnail Designer).
    Hãy đề xuất 3 ý tưởng thiết kế thumbnail cực kỳ thu hút (High CTR) cho video này.
    
    Tiêu đề: "${title}"
    Nội dung tóm tắt: "${scriptExcerpt.substring(0, 300)}..."
    Phong cách nghệ thuật mong muốn: "${style}"

    Yêu cầu:
    - Mỗi ý tưởng là một câu mô tả tiếng Anh chi tiết (Prompt) để đưa vào AI tạo ảnh (như Midjourney/Imagen).
    - Mô tả CẦN PHẢI tuân thủ chặt chẽ phong cách "${style}".
    - Mô tả cần bao gồm: Chủ thể chính, Biểu cảm khuôn mặt, Phông nền, Màu sắc chủ đạo, Phong cách ánh sáng.
    - Không chứa text trong ảnh (vì AI tạo text chưa tốt).
    
    Trả về JSON: { "prompts": ["Prompt 1...", "Prompt 2...", "Prompt 3..."] }
  `;

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                prompts: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text).prompts;
  } catch (error) {
    handleGeminiError(error);
  }
};

export const generateThumbnailImage = async (apiKey: string, prompt: string, style?: string): Promise<string> => {
  try {
    const ai = getAIInstance(apiKey);
    
    // Chế biến prompt với style để tăng độ chính xác của mô hình ảnh
    const styleSuffix = style ? `, ${style} style` : '';
    const finalPrompt = `${prompt}${styleSuffix}, high quality, 8k resolution, youtube thumbnail, vivid colors, highly detailed`;

    // Sử dụng Imagen 3 (imagen-4.0-generate-001)
    const response = await ai.models.generateImages({
        model: IMAGEN_MODEL,
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    // Lấy base64 string
    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("AI không tạo được ảnh.");
    
    return `data:image/jpeg;base64,${base64ImageBytes}`;

  } catch (error) {
    handleGeminiError(error);
  }
};

// --- SOCIAL PROMOTION FEATURES ---

export const generateSocialPosts = async (apiKey: string, title: string, description: string): Promise<{facebook: string, twitter: string, linkedin: string}> => {
  const prompt = `
    Bạn là chuyên gia Social Media Marketing.
    Hãy viết 3 nội dung để quảng bá video YouTube này trên các nền tảng khác nhau.

    Tiêu đề Video: "${title}"
    Nội dung chính: "${description.substring(0, 300)}..."

    Yêu cầu:
    1. Facebook: Thân thiện, dùng emoji, đặt câu hỏi tương tác, có link video (placeholder [LINK]).
    2. Twitter (X): Ngắn gọn, ấn tượng, dùng hashtag trending, dạng thread ngắn.
    3. LinkedIn: Chuyên nghiệp, tập trung vào giá trị kiến thức/bài học, tone nghiêm túc hơn.

    Trả về JSON.
  `;

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                facebook: { type: Type.STRING },
                twitter: { type: Type.STRING },
                linkedin: { type: Type.STRING }
            }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    handleGeminiError(error);
  }
};

// --- TREND INTELLIGENCE (NEW) ---

export const getTrendingIdeas = async (apiKey: string, niche: string): Promise<{ideas: string[], sources: {title: string, uri: string}[]}> => {
  const prompt = `
    Tìm kiếm 5 xu hướng hoặc chủ đề video YouTube đang hot hiện nay liên quan đến: "${niche}".
    Lưu ý: Tìm kiếm thông tin mới nhất từ Google.
    
    Trình bày kết quả dưới dạng danh sách đánh số ngắn gọn (1., 2., 3...).
    Mỗi ý tưởng chỉ viết 1 dòng tiêu đề hấp dẫn.
  `;

  try {
    const ai = getAIInstance(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}], // Search Grounding
        // responseMimeType không được dùng cùng với googleSearch
      },
    });

    const text = response.text || "";
    
    // Parse lines like "1. Topic name"
    const ideas = text.split('\n')
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()) // Remove numbering and markdown bold
      .slice(0, 5);

    // Extract sources
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.filter((c: any) => c.web)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri })) || [];

    // Fallback if parsing fails but we have text (e.g. bullet points)
    if (ideas.length === 0 && text.length > 0) {
         const altIdeas = text.split('\n').filter(l => l.length > 10).slice(0, 5);
         return { ideas: altIdeas, sources };
    }

    return { ideas, sources };
  } catch (error) {
    handleGeminiError(error);
  }
};
