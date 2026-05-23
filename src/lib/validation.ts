export function validateWorkflow(workflow: any) {
  const errors: string[] = [];
  if (!workflow.title || workflow.title.trim() === '') {
    errors.push('عنوان الأتمتة مطلوب');
  }
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push('يجب إضافة خطوة واحدة على الأقل في سير العمل');
  }
  // Check if there is exactly one trigger at the start (usually good practice)
  const triggers = workflow.steps.filter((s: any) => s.type === 'trigger');
  if (triggers.length === 0) {
    errors.push('يجب وجود مشغل (Trigger) واحد لبدء العمل');
  }
  return errors;
}

export function validatePostContent(content: string, platform: string) {
  const errors: string[] = [];
  if (!content || content.trim() === '') {
    errors.push('المحتوى لا يمكن أن يكون فارغاً');
  }
  if (platform === 'X' && content.length > 280) {
    errors.push('محتوى X لا يمكن أن يتجاوز 280 حرفاً');
  }
  return errors;
}

export function validateBrandIdentity(brand: any) {
  const errors: string[] = [];
  if (!brand.name || brand.name.trim() === '') errors.push('اسم العلامة مطلوب');
  return errors;
}
