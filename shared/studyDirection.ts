export const EXPLORING_STUDY_DIRECTION = "Exploring possible study directions";
export const EXPLORING_STUDY_DIRECTION_AR = "عم استكشف مجالات الدراسة";

const englishTerms = [
  "architecture", "architect", "medicine", "medical", "doctor", "nursing", "pharmacy",
  "engineering", "engineer", "computer science", "computer", "software", "data science", "data",
  "business", "economics", "finance", "accounting", "law", "legal", "psychology", "design",
  "art", "humanities", "literature", "history", "philosophy", "music", "biology", "chemistry",
  "physics", "mathematics", "math", "education", "teaching", "media", "journalism", "politics",
  "international relations", "sociology", "agriculture", "environment", "hospitality", "tourism",
];

const arabicTerms = [
  "عمارة", "طب", "طبيب", "تمريض", "صيدلة", "هندسة", "حاسوب", "برمجة", "بيانات", "أعمال", "اقتصاد",
  "مالية", "محاسبة", "قانون", "نفس", "تصميم", "فنون", "إنسانيات", "أدب", "تاريخ", "فلسفة",
  "موسيقى", "أحياء", "كيمياء", "فيزياء", "رياضيات", "تعليم", "إعلام", "صحافة", "سياسة",
  "علاقات دولية", "اجتماع", "زراعة", "بيئة", "ضيافة", "سياحة",
];

function normalise(value: string) {
  return value.trim().toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function hasEnglishIntent(value: string) {
  return englishTerms.some((term) => new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`, "i").test(value));
}

export function isExploringStudyDirections(value: string) {
  return [EXPLORING_STUDY_DIRECTION, EXPLORING_STUDY_DIRECTION_AR].some((option) => normalise(value) === normalise(option));
}

export function isMeaningfulStudyDirection(value: string) {
  const direction = normalise(value);
  if (isExploringStudyDirections(direction)) return true;
  return hasEnglishIntent(direction) || arabicTerms.some((term) => direction.includes(term));
}
