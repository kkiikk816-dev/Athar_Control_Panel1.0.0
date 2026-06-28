export interface ValidationResult {
  valid: boolean;
  data: any[] | null;
  logs: { type: 'success' | 'error' | 'warning', message: string }[];
}

export function validateIncomingJSON(rawText: string, activeCategoryPrefix: string): ValidationResult {
  const logs: { type: 'success' | 'error' | 'warning', message: string }[] = [];

  try {
    // Stage 1: Syntax Validation
    const parsedData = JSON.parse(rawText);

    if (!Array.isArray(parsedData)) {
      throw new Error("المخرجات يجب أن تكون مصفوفة JSON (Array).");
    }

    parsedData.forEach((item, index) => {
      const lineNum = index + 1;

      if (!item.id) {
        throw new Error(`[خطأ منطقي] السطر ${lineNum}: لا يوجد حقل id.`);
      }

      // Stage 2: Semantic Validation
      // A. Prefix check
      const idPattern = new RegExp(`^${activeCategoryPrefix}\\d{6}$`);
      if (!idPattern.test(item.id)) {
        throw new Error(`[خطأ منطقي] السطر ${lineNum}: المعرف ${item.id} لا يطابق النمط المستهدف (${activeCategoryPrefix}000000).`);
      }

      // B. Empty arrays check
      if (!Array.isArray(item.tags) || item.tags.length === 0) {
        logs.push({ type: 'warning', message: `تحذير السطر ${lineNum}: العنصر ${item.id} لا يحتوي على تاغات.` });
        item.tags = [];
      }

      // C. Limit checks
      if (item.tags.length > 4) {
        throw new Error(`[تجاوز الحد] السطر ${lineNum}: العنصر ${item.id} يمتلك أكثر من 4 تاغات.`);
      }

      item.tags.forEach((tag: string) => {
        if (tag.length > 15 || tag.split(' ').length > 2) {
          throw new Error(`[تاغ طويل جداً] السطر ${lineNum}: الوسم (${tag}) يتجاوز الحد المسموح للاختصار.`);
        }
      });
    });

    logs.push({ type: 'success', message: "[Success] JSON is valid & clean. Ready to commit to Supabase." });
    
    return {
      valid: true,
      data: parsedData,
      logs
    };

  } catch (error: any) {
    logs.push({ type: 'error', message: `[Syntax/Logic Error]: ${error.message}` });
    return {
      valid: false,
      data: null,
      logs
    };
  }
}
