/**
 * 한국 표준시(KST)로 현재 날짜 가져오기
 * @returns 한국 표준시로 조정된 Date 객체
 */
export function getKoreanDate(): Date {
  const now = new Date();
  // 한국은 UTC+9
  now.setHours(now.getHours() + 9);
  return now;
}

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 * @param date 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 한국어 형식(YYYY년 MM월 DD일)으로 변환
 * @param date 변환할 Date 객체
 * @returns YYYY년 MM월 DD일 형식의 문자열
 */
export function formatDateToKorean(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기 (KST 기준)
 * @returns 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayDateString(): string {
  return formatDateToYYYYMMDD(getKoreanDate());
}

/**
 * 오늘 날짜를 한국어 형식으로 가져오기 (KST 기준)
 * @returns 오늘 날짜를 YYYY년 MM월 DD일 형식으로 반환
 */
export function getTodayKoreanString(): string {
  return formatDateToKorean(getKoreanDate());
}

/**
 * 특정 날짜의 Firestore 문서 ID 생성
 * @param date 날짜 객체 (기본값: 오늘)
 * @returns YYYY-MM-DD 형식의 문서 ID
 */
export function getDayDocumentId(date: Date = getKoreanDate()): string {
  return formatDateToYYYYMMDD(date);
}
